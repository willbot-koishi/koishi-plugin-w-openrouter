import { capitalize, Context, h, omit, SessionError, z } from 'koishi'
import type {} from 'koishi-plugin-w-as-forward'
import type { DatabaseReactive } from 'koishi-plugin-w-reactive'
import {} from 'koishi-plugin-w-as-slices'
import OpenAI from 'openai'

import { MODELS } from './models'

export const name = 'w-openrouter'

export const inject = [ 'database', 'reactive' ]

export const API_URL = 'https://openrouter.ai/api/v1'

export type ModelName = (typeof MODELS)[number]

export interface Config {
    apiKey: string
    rankUrl: string
    rankName: string
    defaultModel: ModelName
    publicModels: ModelName[]
    sliceLength: number // slice长度(new)
}

export const Config: z<Config> = z.object({
    apiKey: z.string().required().description('OpenRouter API key.'),
    rankUrl: z.string().description('An optional URL, for including your koishi on openrouter.ai rankings.'),
    rankName: z.string().description('Shows in rankings on openrouter.ai.'),
    defaultModel: z.union(MODELS).description('The default model to use.'),
    publicModels: z.array(z.union(MODELS))
        .default(MODELS.filter(model => model.includes('free')))
        .description('Public models that everyone is allowed to use.'),
    sliceLength: z.number().default(1200).description('Length of each message slice.')
})

export type OpenRouterContextMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam

export interface OpenRouterContext {
    id: string
    model: ModelName
    owner: string
    messages: OpenRouterContextMessage[]
}

export interface OpenRouterUser {
    defaultContext: string | null
    defaultModel: ModelName | null
    availableModels: ModelName[]
}

declare module 'koishi' {
    interface Tables {
        'w-openrouter-context': OpenRouterContext
    }
}

export function apply(ctx: Context, config: Config) {
    const openai = new OpenAI({
        baseURL: API_URL,
        apiKey: config.apiKey,
        defaultHeaders: {
            'HTTP-Referer': config.rankUrl,
            'X-Title': config.rankName
        }
    })

    const users: Record<string, DatabaseReactive<OpenRouterUser>> = {}
    const getUser = async (uid: string) => users[uid]
        ??= await ctx.reactive.create<OpenRouterUser>('openrouter-user', uid, {
            defaultContext: null,
            defaultModel: null,
            availableModels: []
        })

    type GetContextOptions = {
        owner?: string
        whenNotFound?: 'fail' | 'create'
    }
    type GetContextResult =
        | {
            status: 'ok'
            context: OpenRouterContext
        }
        | {
            status: 'err'
            reason: 'NotFound'
        }
        | {
            status: 'err'
            reason: 'WrongOwner'
        }
        | {
            status: 'err'
            reason: 'Unreachable'
        }

    const getContext = async (
        id: string,
        { owner, whenNotFound = 'fail' }: GetContextOptions = {}
    ): Promise<GetContextResult> => {
        const [ context ] = await ctx.database.get('w-openrouter-context', id)
        if (! context) {
            if (whenNotFound === 'fail') return { status: 'err', reason: 'NotFound' }
            else if (whenNotFound === 'create') {
                if (! owner) return { status: 'err', reason: 'Unreachable' }
                const context = await ctx.database.create('w-openrouter-context', {
                    id, owner
                })
                return { status: 'ok', context }
            }
        }
        if (owner && context.owner !== owner) return { status: 'err', reason: 'WrongOwner' }
        return { status: 'ok', context }
    }

    const tryToGetContext = async (id: string, uid: string) => {
        if (! id) return null
        const contextResult = await getContext(id, { owner: uid, whenNotFound: 'fail' })
        if (contextResult.status === 'err')
            throw new SessionError('error', [ `Failed to get context: ${contextResult.reason}` ])
        return contextResult.context
    }

    const checkModelName = (modelName: string): ModelName => {
        if (! modelName) return null
        if (! MODELS.includes(modelName as any))
            throw new SessionError('error', [ `Unknown model '${modelName}.'` ])
        return modelName as ModelName
    }

    const checkUserModelAuthority = (userR: OpenRouterUser, model: ModelName) => {
        if (config.publicModels.includes(model) || userR.availableModels?.includes(model)) return
        throw new SessionError('error', [ `You are not allowed to use model '${model}'.` ])
    }

    type RenderContextOptions = {
        contextId?: string
        showHistory?: boolean
        model?: ModelName
    }
const renderContextMessages = (
    messages: OpenRouterContextMessage[],
    { showHistory = false, contextId, model }: RenderContextOptions = {}
) => (
    <as-forward level='always'>
        <as-slices header={<><message>[Context] { contextId || 'Temporary context' }</message><message>[Model] { model }</message></>} 
            { (showHistory ? messages : messages.slice(-2))
                .map(message => (
                    <message>
                        { `[${capitalize(message.role)}] ${message.content}` }
                    </message>
                ))
            }
        </as-slices>
    </as-forward>
);

    ctx.model.extend('w-openrouter-context', {
        id: 'string',
        owner: 'string',
        model: 'string',
        messages: {
            type: 'array',
            inner: 'json'
        }
    }, { primary: 'id' })

    ctx.i18n.define('en-US', {
        error: '[Error] {0}'
    })

    ctx.command('openrouter <message:text>', 'Chat with OpenRouter.')
        .alias('or')
        .option('context', '-c <id:string> use persistent context (auto create)')
        .option('model', '-m <model:string> use specific model')
        .option('history', '-H show the context history')
        .action(async (
            {
                session: { uid },
                options: {
                    model: modelName,
                    context: contextId,
                    history: showHistory
                }
            },
            inputText
        ) => {
            const { reactive: userR } = await getUser(uid)

            contextId ||= userR.defaultContext
            const context = await tryToGetContext(contextId, uid)

            const model = checkModelName(modelName) || context?.model || userR.defaultModel || config.defaultModel

            const messages = context?.messages ?? []
            messages.push({
                role: 'user',
                content: inputText
            })

            const completion = await openai.chat.completions.create({
                model, messages
            })

            const outputMessage = completion.choices[0].message
            const outputContext = outputMessage.content || outputMessage.refusal
            messages.push({
                role: 'assistant',
                content: outputContext
            })

            if (context) {
                await ctx.database.set('w-openrouter-context', contextId, omit(context, ['id']))
            }

            return renderContextMessages(messages, { showHistory, contextId, model })
        })

    ctx.command('openrouter.model', 'Manage OpenRouter models.')

    ctx.command('openrouter.model.list', 'List models.')
        .option('filter', '-f <filter:string> filter by model name')
        .option('allowed', '-a filter models which you are allowed to use')
        .option('public', '-p filter public models')
        .option('public', '-P filter non-public models', { value: false })
        .action(async (
            { session: { uid }, options: { filter, public: isPublic, allowed } }
        ) => {
            const { reactive: userR } = await getUser(uid)

            const models = MODELS
                .filter(model =>
                    (filter ? model.includes(filter) : true) &&
                    (allowed ? userR.availableModels.includes(model) : true) &&
                    (typeof isPublic === 'boolean' ? config.publicModels.includes(model) === isPublic : true)
                )

            return `[OK] ${models.length} models are supported:\n${
                models
                    .map(model =>
                        (config.publicModels.includes(model) ? h.escape(`<public> `) : '') +
                        (config.defaultModel === model ? h.escape(`<plugin default> `) : '') +
                        (userR.defaultModel === model ? h.escape(`<user default> `) : '') +
                        model
                    )
                    .sort()
                    .join('\n')
            }`
        })

    ctx.command('openrouter.model.select <model:string>', 'Select your default model.')
        .action(async ({ session: { uid } }, modelName) => {
            const model = checkModelName(modelName)
            const { reactive: userR } = await getUser(uid)
            checkUserModelAuthority(userR, model)
            userR.defaultModel = model
            return `[OK] Selected model '${model}' as your default.`
        })

    ctx.command('openrouter.model.authorize <user:user> <model:string> [allow:boolean]', 'Allow a user to use a model.', { authority: 4 })
        .action(async ({}, userId, modelName, allow = true) => {
            const user = await getUser(userId)
            const model = checkModelName(modelName)
            await user.patch(it => {
                const models = it.availableModels ??= []
                if (allow) {
                    if (! models.includes(model)) models.push(model)
                }
                else {
                    const index = models.indexOf(model)
                    if (index >= 0) models.splice(index, 1)
                }
            })
            return <message>
                [OK] {allow ? 'Allowed' : 'Disallowed'} <at id={userId.split(':')[1]} /> to use model '{model}'.
            </message>
        }) 

    ctx.command('openrouter.context', 'Manage OpenRouter contexts.')

    ctx.command('openrouter.context.create <id:string>', 'Create a context.')
        .option('select', '-s select the newly created context as your default')
        .option('model', '-m <model:string> use specific model')
        .action(async (
            { session: { uid }, options: { model: modelName, select: doSelect } },
            id
        ) => {
            const contextResult = await getContext(id)
            if (contextResult.status === 'ok') return `[Error] Context id '${id}' has been used.`

            const { reactive: userR } = await getUser(uid)
            const model = checkModelName(modelName) || userR.defaultModel || config.defaultModel
            checkUserModelAuthority(userR, model)

            const context: OpenRouterContext = {
                id,
                model,
                owner: uid,
                messages: []
            }
            await ctx.database.create('w-openrouter-context', context)

            if (doSelect) userR.defaultContext = id

            return `[OK] Created${doSelect ? ' and selected' : ''} context '${id}'.`
        })

    ctx.command('openrouter.context.show <id:string>', 'Show the detail of a context.')
        .action(async ({ session: { uid } }, id) => {
            const context = await tryToGetContext(id, uid)
            return renderContextMessages(context.messages, { showHistory: true, contextId: id, model: context.model })
        })

    ctx.command('openrouter.context.select <id:string>', 'Select your default context.')
        .action(async ({ session: { uid } }, id) => {
            await tryToGetContext(id, uid)
            const { reactive: userR } = await getUser(uid)
            userR.defaultContext = id

            return `[OK] Selected context '${id}' as your default.`
        })

    ctx.command('openrouter.context.remove <id:string>', 'Remove a context.')
        .action(async ({ session: { uid } }, id) => {
            await tryToGetContext(id, uid)

            const { reactive: userR } = await getUser(uid)
            if (userR.defaultContext === id) userR.defaultContext = null

            await ctx.database.remove('w-openrouter-context', id)
            return `[OK] Removed context '${id}'.`
        })

    ctx.command('openrouter.context.list', 'List your contexts.')
        .action(async ({ session: { uid } }) => {
            const { reactive: { defaultContext } } = await getUser(uid)
            const contexts = await ctx.database.get('w-openrouter-context', { owner: uid })
            return `[OK] You have ${contexts.length} contexts:\n${
                contexts
                    .map(context => (defaultContext === context.id ? h.escape('<default> ') : '') + context.id +
                        ' : ' + context.model)
                    .join('\n') || 'N/A'
            }`
        })

    ctx.command('openrouter.debug', 'Debug commands.')

    ctx.command('openrouter.debug.eval <code:text>', 'Eval JavaScript code in plugin scope.', { authority: 4 })
        .option('return', '-r directly return eval result')
        .action(async (argv, code) => {
            try {
                const result = await eval(code)
                return argv.options.return ? result : JSON.stringify(result, null, 2)
            }
            catch (err) {
                return JSON.stringify(err, null, 2)
            }
        })

    ctx.on('dispose', () => {
        Object.values(users).forEach(user => user.dispose())
    })
}

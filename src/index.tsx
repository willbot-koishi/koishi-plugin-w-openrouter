import { capitalize, Context, omit, z } from 'koishi'
import {} from 'koishi-plugin-w-as-forward'

import OpenAI from 'openai'

export const name = 'w-openrouter'

export const inject = [ 'database' ]

export const API_URL = 'https://openrouter.ai/api/v1'

export const MODELS = [
    'x-ai/grok-2-mini',
    'x-ai/grok-2',
    'inflection/inflection-3-productivity',
    'inflection/inflection-3-pi',
    'google/gemini-flash-1.5-8b',
    'liquid/lfm-40b',
    'liquid/lfm-40b:free',
    'thedrummer/rocinante-12b',
    'eva-unit-01/eva-qwen-2.5-14b',
    'anthracite-org/magnum-v2-72b',
    'meta-llama/llama-3.2-3b-instruct:free',
    'meta-llama/llama-3.2-3b-instruct',
    'meta-llama/llama-3.2-1b-instruct:free',
    'meta-llama/llama-3.2-1b-instruct',
    'meta-llama/llama-3.2-90b-vision-instruct',
    'meta-llama/llama-3.2-11b-vision-instruct:free',
    'meta-llama/llama-3.2-11b-vision-instruct',
    'qwen/qwen-2.5-72b-instruct',
    'qwen/qwen-2-vl-72b-instruct',
    'neversleep/llama-3.1-lumimaid-8b',
    'openai/o1-mini-2024-09-12',
    'openai/o1-mini',
    'openai/o1-preview-2024-09-12',
    'openai/o1-preview',
    'mistralai/pixtral-12b',
    'cohere/command-r-plus-08-2024',
    'cohere/command-r-08-2024',
    'qwen/qwen-2-vl-7b-instruct',
    'google/gemini-flash-1.5-8b-exp',
    'sao10k/l3.1-euryale-70b',
    'google/gemini-flash-1.5-exp',
    'ai21/jamba-1-5-large',
    'ai21/jamba-1-5-mini',
    'microsoft/phi-3.5-mini-128k-instruct',
    'nousresearch/hermes-3-llama-3.1-70b',
    'nousresearch/hermes-3-llama-3.1-405b:free',
    'nousresearch/hermes-3-llama-3.1-405b',
    'nousresearch/hermes-3-llama-3.1-405b:extended',
    'perplexity/llama-3.1-sonar-huge-128k-online',
    'openai/chatgpt-4o-latest',
    'sao10k/l3-lunaris-8b',
    'aetherwiing/mn-starcannon-12b',
    'openai/gpt-4o-2024-08-06',
    'meta-llama/llama-3.1-405b',
    'nothingiisreal/mn-celeste-12b',
    'google/gemini-pro-1.5-exp',
    'perplexity/llama-3.1-sonar-large-128k-online',
    'perplexity/llama-3.1-sonar-large-128k-chat',
    'perplexity/llama-3.1-sonar-small-128k-online',
    'perplexity/llama-3.1-sonar-small-128k-chat',
    'meta-llama/llama-3.1-70b-instruct:free',
    'meta-llama/llama-3.1-70b-instruct',
    'meta-llama/llama-3.1-8b-instruct:free',
    'meta-llama/llama-3.1-8b-instruct',
    'meta-llama/llama-3.1-405b-instruct:free',
    'meta-llama/llama-3.1-405b-instruct',
    'mistralai/codestral-mamba',
    'mistralai/mistral-nemo',
    'openai/gpt-4o-mini-2024-07-18',
    'openai/gpt-4o-mini',
    'qwen/qwen-2-7b-instruct:free',
    'qwen/qwen-2-7b-instruct',
    'google/gemma-2-27b-it',
    'alpindale/magnum-72b',
    'nousresearch/hermes-2-theta-llama-3-8b',
    'google/gemma-2-9b-it:free',
    'google/gemma-2-9b-it',
    'ai21/jamba-instruct',
    'anthropic/claude-3.5-sonnet',
    'anthropic/claude-3.5-sonnet:beta',
    'sao10k/l3-euryale-70b',
    'cognitivecomputations/dolphin-mixtral-8x22b',
    'qwen/qwen-2-72b-instruct',
    'nousresearch/hermes-2-pro-llama-3-8b',
    'mistralai/mistral-7b-instruct-v0.3',
    'mistralai/mistral-7b-instruct:free',
    'mistralai/mistral-7b-instruct',
    'mistralai/mistral-7b-instruct:nitro',
    'microsoft/phi-3-mini-128k-instruct:free',
    'microsoft/phi-3-mini-128k-instruct',
    'microsoft/phi-3-medium-128k-instruct:free',
    'microsoft/phi-3-medium-128k-instruct',
    'neversleep/llama-3-lumimaid-70b',
    'google/gemini-flash-1.5',
    'deepseek/deepseek-chat',
    'perplexity/llama-3-sonar-large-32k-online',
    'perplexity/llama-3-sonar-large-32k-chat',
    'perplexity/llama-3-sonar-small-32k-online',
    'perplexity/llama-3-sonar-small-32k-chat',
    'meta-llama/llama-guard-2-8b',
    'openai/gpt-4o-2024-05-13',
    'openai/gpt-4o',
    'openai/gpt-4o:extended',
    'qwen/qwen-72b-chat',
    'qwen/qwen-110b-chat',
    'neversleep/llama-3-lumimaid-8b',
    'neversleep/llama-3-lumimaid-8b:extended',
    'sao10k/fimbulvetr-11b-v2',
    'meta-llama/llama-3-70b-instruct',
    'meta-llama/llama-3-70b-instruct:nitro',
    'meta-llama/llama-3-8b-instruct:free',
    'meta-llama/llama-3-8b-instruct',
    'meta-llama/llama-3-8b-instruct:nitro',
    'meta-llama/llama-3-8b-instruct:extended',
    'mistralai/mixtral-8x22b-instruct',
    'microsoft/wizardlm-2-7b',
    'microsoft/wizardlm-2-8x22b',
    'google/gemini-pro-1.5',
    'openai/gpt-4-turbo',
    'cohere/command-r-plus',
    'cohere/command-r-plus-04-2024',
    'databricks/dbrx-instruct',
    'sophosympatheia/midnight-rose-70b',
    'cohere/command-r',
    'cohere/command',
    'anthropic/claude-3-haiku',
    'anthropic/claude-3-haiku:beta',
    'anthropic/claude-3-sonnet',
    'anthropic/claude-3-sonnet:beta',
    'anthropic/claude-3-opus',
    'anthropic/claude-3-opus:beta',
    'cohere/command-r-03-2024',
    'mistralai/mistral-large',
    'openai/gpt-4-turbo-preview',
    'openai/gpt-3.5-turbo-0613',
    'nousresearch/nous-hermes-2-mixtral-8x7b-dpo',
    'mistralai/mistral-medium',
    'mistralai/mistral-small',
    'mistralai/mistral-tiny',
    'nousresearch/nous-hermes-yi-34b',
    'mistralai/mistral-7b-instruct-v0.2',
    'cognitivecomputations/dolphin-mixtral-8x7b',
    'google/gemini-pro',
    'google/gemini-pro-vision',
    'mistralai/mixtral-8x7b-instruct',
    'mistralai/mixtral-8x7b-instruct:nitro',
    'mistralai/mixtral-8x7b',
    'gryphe/mythomist-7b:free',
    'gryphe/mythomist-7b',
    'openchat/openchat-7b:free',
    'openchat/openchat-7b',
    'neversleep/noromaid-20b',
    'anthropic/claude-instant-1.1',
    'anthropic/claude-2.1',
    'anthropic/claude-2.1:beta',
    'anthropic/claude-2',
    'anthropic/claude-2:beta',
    'teknium/openhermes-2.5-mistral-7b',
    'openai/gpt-4-vision-preview',
    'lizpreciatior/lzlv-70b-fp16-hf',
    'alpindale/goliath-120b',
    'undi95/toppy-m-7b:free',
    'undi95/toppy-m-7b',
    'undi95/toppy-m-7b:nitro',
    'openrouter/auto',
    'openai/gpt-4-1106-preview',
    'openai/gpt-3.5-turbo-1106',
    'google/palm-2-codechat-bison-32k',
    'google/palm-2-chat-bison-32k',
    'jondurbin/airoboros-l2-70b',
    'xwin-lm/xwin-lm-70b',
    'mistralai/mistral-7b-instruct-v0.1',
    'openai/gpt-3.5-turbo-instruct',
    'pygmalionai/mythalion-13b',
    'openai/gpt-4-32k-0314',
    'openai/gpt-4-32k',
    'openai/gpt-3.5-turbo-16k',
    'nousresearch/nous-hermes-llama2-13b',
    'huggingfaceh4/zephyr-7b-beta:free',
    'mancer/weaver',
    'anthropic/claude-instant-1.0',
    'anthropic/claude-1.2',
    'anthropic/claude-1',
    'anthropic/claude-instant-1',
    'anthropic/claude-instant-1:beta',
    'anthropic/claude-2.0',
    'anthropic/claude-2.0:beta',
    'undi95/remm-slerp-l2-13b',
    'undi95/remm-slerp-l2-13b:extended',
    'google/palm-2-codechat-bison',
    'google/palm-2-chat-bison',
    'gryphe/mythomax-l2-13b:free',
    'gryphe/mythomax-l2-13b',
    'gryphe/mythomax-l2-13b:nitro',
    'gryphe/mythomax-l2-13b:extended',
    'meta-llama/llama-2-13b-chat',
    'openai/gpt-4-0314',
    'openai/gpt-4',
    'openai/gpt-3.5-turbo-0301',
    'openai/gpt-3.5-turbo-0125',
    'openai/gpt-3.5-turbo',
] as const

export type ModelName = (typeof MODELS)[number]

export interface Config {
    apiKey: string
    rankUrl: string
    rankName: string
    model: ModelName
}

export const Config: z<Config> = z.object({
    apiKey: z.string().required().description('OpenRouter API key.'),
    rankUrl: z.string().description('An optional URL, for including your koishi on openrouter.ai rankings.'),
    rankName: z.string().description('Shows in rankings on openrouter.ai.'),
    model: z.union(MODELS)
})

export type OpenRouterContextMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam

export interface OpenRouterContext {
    id: string
    owner: string
    messages: OpenRouterContextMessage[]
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

    type GetContextOptions = {
        owner?: string
        whenNotFound?: 'fail' | 'pass' | 'create'
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
            else if (whenNotFound === 'pass') {
                return { status: 'ok', context: null }
            }
        }
        if (owner && context.owner !== owner) return { status: 'err', reason: 'WrongOwner' }
        return { status: 'ok', context }
    }

    type RenderContextOptions = {
        contextId?: string
        showHistory?: boolean
    }
    const renderContextMessages = (
        messages: OpenRouterContextMessage[],
        { showHistory = false, contextId }: RenderContextOptions = {}
    ) => <as-forward level='always'>
        <message>[Context] { contextId || 'Temporary context' }</message>
        { (showHistory ? messages : messages.slice(- 2))
            .map(message => <message>
                { `[${capitalize(message.role)}] ${message.content}` }
            </message>)
        }
    </as-forward>

    ctx.model.extend('w-openrouter-context', {
        id: 'string',
        owner: 'string',
        messages: {
            type: 'array',
            inner: 'json'
        }
    }, { primary: 'id' })

    ctx.command('openrouter <message:text>', 'Chat with OpenRouter.')
        .alias('or')
        .option('context', '-c <id:string> use persistent context (auto create)')
        .option('model', '-m <model:string> use specific model')
        .option('history', '-H show the context history')
        .action(async (
            {
                session: { uid },
                options: {
                    model = config.model,
                    context: contextId,
                    history: showHistory
                }
            },
            inputText
        ) => {
            if (! MODELS.includes(model as any)) return `[Error] Unknown model '${model}'.`

            const contextResult = await getContext(contextId, { owner: uid, whenNotFound: 'pass' })
            if (contextResult.status === 'err') return `[Error] Failed to get context: ${contextResult.reason}.`

            const { context } = contextResult
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
                await ctx.database.set('w-openrouter-context', contextId, omit(context, [ 'id' ]))
            }

            return renderContextMessages(messages, { showHistory, contextId })
        })

    ctx.command('openrouter.model', 'Manage OpenRouter models.')
    ctx.command('openrouter.model.list')
        .option('filter', '-f <filter:string> filter model')
        .action(({ options: { filter } }) => `[OK] ${MODELS.length} models are supported:\n${
            MODELS
                .filter(model => filter ? model.includes(filter) : true)
                .join('\n')
        }`)

    ctx.command('openrouter.context', 'Manage OpenRouter contexts.')

    ctx.command('openrouter.context.create <id:string>', 'Create a context.')
        .action(async ({ session }, id) => {
            const contextResult = await getContext(id)
            if (contextResult.status === 'ok') return `[Error] Context id '${id}' has been used.`

            const context: OpenRouterContext = {
                id,
                owner: session.uid,
                messages: []
            }

            context.messages[0].role

            await ctx.database.create('w-openrouter-context', context)
            return `[OK] Created context '${id}'.`
        })

    ctx.command('openrouter.context.show <id:string>', 'Show the detail of a context.')
        .action(async (
            { session: { uid } },
            id
        ) => {
            const contextResult = await getContext(id, { owner: uid, whenNotFound: 'fail' })
            if (contextResult.status === 'err') return `[Error] Failed to get context: ${contextResult.reason}`
            
            const { context } = contextResult

            return renderContextMessages(context.messages, { showHistory: true, contextId: id })
        })

    ctx.command('openrouter.context.list', 'List your contexts.')
        .action(async (
            { session: { uid } }
        ) => {
            const contexts = await ctx.database.get('w-openrouter-context', { owner: uid })
            return `[OK] You have ${contexts.length} contexts:\n${
                contexts.map(context => context.id).join('\n') || 'N/A'
            }`
        })

    ctx.command('openrouter.context.remove <id:string>', 'Remove a context.')
        .action(async (
            { session: { uid } },
            id
        ) => {
            const contextResult = await getContext(id, { owner: uid, whenNotFound: 'fail' })
            if (contextResult.status === 'err') return `[Error] Failed to get context: ${contextResult.reason}`
            
            await ctx.database.remove('w-openrouter-context', id)
            return `[OK] Removed context '${id}'.`
        })
}

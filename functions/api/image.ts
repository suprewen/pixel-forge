import { jsonResponse } from '../../src/shared/server'

type Env = {
  PIXEL_FORGE_UPLOADS: R2Bucket
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const key = url.searchParams.get('key')
  if (!key) return jsonResponse({ error: 'KEY_REQUIRED' }, 400)

  const object = await env.PIXEL_FORGE_UPLOADS.get(key)
  if (!object) return jsonResponse({ error: 'NOT_FOUND' }, 404)

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('cache-control', 'private, max-age=300')
  return new Response(object.body, { headers })
}

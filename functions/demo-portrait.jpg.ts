export const onRequest: PagesFunction = async () => {
  return new Response('Not found', {
    status: 404,
    headers: {
      'cache-control': 'no-store, max-age=0',
      'content-type': 'text/plain; charset=utf-8',
    },
  })
}

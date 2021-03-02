import * as http from 'http'
import { EventEmitter } from 'events'

import Context from './context'
import * as router from './router'
import * as logger from './logger'

export default class App extends EventEmitter {
  server: http.Server

  constructor() {
    super()
    this.server = http.createServer(async (req, res) => {
      let startTime = Date.now()
      let ctx = new Context(req, res)
      try {
        ctx.res.setHeader('X-Request-Id', ctx.requestId)
        await router.parse(ctx)
      } catch (error) {
        logger.error({
          requestId: ctx.requestId,
          type: 'request-error',
          message: error.message || ''
        })
        logger.trace(error)
        if (ctx.res.statusCode === 200) ctx.res.statusCode = 500
        ctx.res.end()
        this.emit('request-error', error, ctx)
      } finally {
        let endTime = Date.now()
        logger.info({
          requestId: ctx.requestId,
          ip: ctx.ip,
          statusCode: ctx.res.statusCode,
          method: ctx.req.method,
          url: ctx.req.url,
          cost: endTime - startTime,
          ...ctx.log
        })
      }
    })
    this.server.on('error', error => {
      this.emit('server-error', error)
    })
  }

  listen(port: number, hostname: string = '0.0.0.0') {
    this.server.listen(port, hostname, () => logger.info({
      info: `server listening on http://${hostname}:${port}`
    }))
  }

  route(Controller: new () => Object) {
    router.add(Controller)
  }
}
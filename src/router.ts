/**
 * 路由处理
 */
import * as Joi from 'joi'
import Context from './context'
import { ControllerApi, ApiType } from './controller'

type RouteCallback = (ctx: Context) => Promise<any>

interface Route {
  path: string
  type: ApiType
  callback: RouteCallback
  schema?: Joi.ObjectSchema
}

let routes: Route[] = []

export enum Status {
  OK = 200,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  MethodNotAllowed = 405,
  InternalServerError = 500
}

export class ReqStat {
  stat: string
  msg: string
  statusCode: number

  constructor(stat: string, msg: string, statusCode: number = Status.OK) {
    this.stat = stat
    this.msg = msg
    this.statusCode = statusCode
  }
}

// 解析路由
export async function parse(ctx: Context) {
  for (let route of routes) {
    let exp = new RegExp(`^${route.path}`)
    if (exp.test(ctx.url) === true) {
      if (route.type !== 'stream') {
        if (
          route.type !== 'use' &&
          ctx.req.method.toLowerCase() !== route.type
        ) {
          ctx.res.statusCode = 405
          return ctx.res.end()
        }
        await ctx.parseBody()
        let result: any = {}
        try {
          if (route.schema !== null) {
            let error: Joi.ValidationError
            if (route.type === 'get') {
              let validResult = route.schema.validate(ctx.query)
              error = validResult.error
              ctx.query = validResult.value || ctx.query
            }
            if (route.type === 'post') {
              let validResult = route.schema.validate(ctx.body)
              error = validResult.error
              ctx.body = validResult.value || ctx.body
            }
            if (error) {
              throw new ReqStat('ERR_BAD_PARAMS', error.message, Status.BadRequest)
            }
          }
          result = await route.callback(ctx)
        } catch (error) {
          if (error instanceof ReqStat) {
            ctx.res.statusCode = error.statusCode
            result = {
              stat: error.stat,
              msg: error.msg
            }
          } else if (typeof error === 'string') {
            result.stat = error
          } else throw error
        }
        if (result === undefined) continue
        switch (typeof result) {
          case 'string':
            if (ctx.res.hasHeader('content-type') === false) {
              ctx.res.setHeader('Content-Type', 'text/plain')
            }
            ctx.res.end(result)
            break
          case 'object':
            if (result.stat) ctx.log.stat = result.stat
            ctx.json(result)
            break
          default:
            ctx.res.end(result)
        }
      } else {
        await route.callback(ctx)
      }
      return
    }
  }
  ctx.res.statusCode = 404
  ctx.res.end()
}

export async function add(Controller: new () => any) {
  let prefix = Reflect.getMetadata('prefix', Controller) || ''
  let apis: ControllerApi[] = Reflect.getMetadata('routes', Controller)
  if (!apis) return
  let controller = new Controller()
  for (let api of apis) {
    let route: Route = {
      path: prefix + api.path,
      type: api.method,
      callback: controller[api.route].bind(controller),
      schema: api.schema
    }
    routes.push(route)
  }
}

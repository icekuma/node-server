/**
 * 路由处理
 */
import Context from './context'
import * as logger from './logger'

type RouteCallback = (ctx: Context) => Promise<any>

interface Route {
  path: string
  type: 'use' | 'stream' | 'get' | 'post'
  callback: RouteCallback
}

let routes: Route[] = []
let stats: any = {}

export enum Status {
  OK = 200,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
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

export function setStats(data: any) {
  stats = data
}

// 文本接口
export function use(path: string, callback: RouteCallback) {
  routes.push({
    path,
    type: 'use',
    callback
  })
}

// GET接口
export function get(path: string, callback: RouteCallback) {
  routes.push({
    path,
    type: 'get',
    callback
  })
}

// POST接口
export function post(path: string, callback: RouteCallback) {
  routes.push({
    path,
    type: 'post',
    callback
  })
}

// 数据流接口
export function stream(path: string, callback: RouteCallback) {
  routes.push({
    path,
    type: 'stream',
    callback
  })
}

// 解析路由
export async function parse(ctx: Context) {
  try {
    for (let route of routes) {
      let exp = new RegExp(`^${route.path}`)
      if (exp.test(ctx.url) === true) {
        if (route.type !== 'stream') {
          if (route.type !== 'use' && ctx.req.method.toLowerCase() !== route.type) {
            ctx.res.statusCode = 405
            throw 'Method Not Allowed'
          }
          await ctx.parseBody()
          let result: any = {}
          try {
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
              if (stats[result.stat]) result.msg = stats[result.stat]
            }
            else throw error
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
  } catch (error) {
    logger.error({
      requestId: ctx.requestId,
      error
    })
    if (ctx.res.statusCode === 200) ctx.res.statusCode = 500
    ctx.res.end()
  }
}

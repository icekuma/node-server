import 'reflect-metadata'
import * as Joi from 'joi'

export type ApiType = 'get' | 'post' | 'use' | 'stream'

export interface ControllerApi {
  path: string
  method: ApiType
  route: string
  schema: Joi.ObjectSchema
}

function addRoute(method: ApiType) {
  return function(path: string, schema?: Joi.ObjectSchema) {
    if (path === '') throw new Error('route path could not be empty.')
    return function (
      target: Object,
      property: string
    ) {
      let _target = target.constructor
      Reflect.defineMetadata('isRoute', true, _target, property)
      if (schema) {
        Reflect.defineMetadata('schema', schema, _target, property)
      }
      if (Reflect.hasMetadata('routes', _target) === false) {
        Reflect.defineMetadata('routes', [], _target)
      }
      let routes: ControllerApi[] = Reflect.getMetadata('routes', _target)
      routes.push({
        path,
        method,
        route: property,
        schema: schema || null
      })
      Reflect.defineMetadata('routes', routes, _target)
    }
  }
}

export function Controller(prefix?: string) {
  return function (target: Object) {
    if (prefix) Reflect.defineMetadata('prefix', prefix, target)
  }
}

export const Get = addRoute('get')
export const Post = addRoute('post')
export const Use = addRoute('use')
export const Stream = addRoute('stream')
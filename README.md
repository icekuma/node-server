# node-server

- `npm i`
- `npx tsc`

# 0.1.2

内容变更

- 增加新的依赖，需要 `npm i`
- 废弃旧的路由定义方式
- 增加新的基于装饰器的路由定义方式(不支持静态方法)
- 支持Joi参数校验，https://joi.dev/api/
- 废除原有的创建实例的方式，采用新的实例化方式
- 增加了错误监听的支持

tsconfig

```json
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

示例代码

`index.ts`

```TypeScript
import config from './config'
import UserApi from './api/user'
import PageApi from './api/page'
import { App, Context, logger } from '../../server'
import * as db from './db'

let app = new App()
app.route(PageApi)
app.route(UserApi)
db.init()
  .then(() => app.listen(config.port))
  .catch(logger.trace)

// 未捕获的Api异常
app.on('request-error', (error: Error, ctx: Context) => {
  logger.error({
    type: 'request-error',
    message: error.message,
    requestId: ctx.requestId
  })
})

// 未捕获的服务异常
app.on('server-error', (error: Error) => {
  logger.error({
    type: 'server-error',
    message: error.message
  })
})

// 未捕获的进程异常
process.on('uncaughtException', error => {
  logger.error(error)
})
```

`user.ts`

```TypeScript
import {
  Controller,
  Post,
  Use,
  Get,
  Context,
  ReqStat,
  Joi
} from '../../../server'
import * as service from '../service'
import { IUser, Pick } from '../types'

function Auth(target: Object, property: string,  descriptor: TypedPropertyDescriptor<Function>) {
  let method = descriptor.value
  descriptor.value = function() {
    let ctx: Context = arguments[0]
    if (ctx.env.user !== 'admin') throw new ReqStat('ERR_AUTH_FAILED', '认证失败')
    return method.apply(this, arguments)
  }
}

@Controller('/api/v1/user')
export default class UserApi {

  @Use('/')
  async before(ctx: Context) {
    ctx.env.user = 'admin'
  }

  // 引发异常
  @Get('/error')
  async error(ctx: Context) {
    throw new Error('error test')
  }

  // Get参数校验
  @Get('/search', Joi.object({
    name: Joi.string().min(2).max(5).required()
  }))
  async search(ctx: Context) {
    return {
      stat: 'OK',
      name: ctx.query.name
    }
  }

  @Post('/list')
  async list() {
    let users = await service.listUsers()
    return {
      stat: 'OK',
      users
    }
  }

  @Post('/find', Joi.object({
    _id: Joi.string().required()
  }))
  async find(ctx: Context) {
    let result = await service.findUser(ctx.body._id)
    return {
      stat: 'OK',
      result
    }
  }

  @Auth
  @Post('/add', Joi.object({
    name: Joi.string().min(2).max(20).required(),
    age: Joi.number().integer().min(0).max(120).required().strict(),
    phone: Joi.string().required()
  }))
  async add(ctx: Context) {
    let result = await service.addUser({
      name: ctx.body.name,
      age: ctx.body.age,
      phone: ctx.body.phone
    })
    return {
      stat: 'OK',
      result
    }
  }

  @Auth
  @Post('/del', Joi.object({
    _id: Joi.string().required()
  }))
  async del(ctx: Context) {
    let result = await service.delUser(ctx.body._id)
    return {
      stat: 'OK',
      result
    }
  }

  @Auth
  @Post('/update', Joi.object({
    name: Joi.string().min(2).max(20),
    age: Joi.number().integer().min(0).max(120).strict(),
    phone: Joi.string()
  }))
  async update(ctx: Context) {
    let record: Pick<IUser> = {}
    if (ctx.body.name !== undefined) record.name = ctx.body.name
    if (ctx.body.age !== undefined) record.age = ctx.body.age
    if (ctx.body.phone !== undefined) record.phone = ctx.body.phone
    let result = await service.updateUser(ctx.body._id, record)
    return {
      stat: 'OK',
      result
    }
  }

}

```

# 0.1.1

新增内容，具体参数参考类型提示

`ctx.setCookie` 设置cookie
  
  ```TypeScript
  ctx.setCookie({
    name: 'test',
    value: 'abc',
    expires: Date.now() + 3600 * 1000
  })
  ```

`ctx.removeCookie` 删除cookie
  
  ```TypeScript
  ctx.removeCookie('test')
  ```

`ctx.redirect` 重定向

  ```TypeScript
  ctx.redirect('https://www.baidu.com/')
  ```

`ReqStat` 类用来定义错误状态返回码，从默认入口导入

- stats.ts

  ```TypeScript
  import { ReqStat, Status } from '../../server'

  export default {
    ErrBadParams: new ReqStat('ERR_BAD_PARAMS', '参数错误', Status.BadRequest)
  }

  ```
- api.ts

  ```TypeScript
  import stats from './stats'

  router.post('/api/test', async ctx => {
    if (!ctx.body.id) throw stats.ErrBadParams
  })
  ```

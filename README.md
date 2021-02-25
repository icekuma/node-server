# node-server

- `npm i`
- `npx tsc`

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

* the `method` function should work even before the `connection` function was called. The RPC server has to be started after calling the `start` function. E.g., this should work:

``` javascript
let server = new jimbo.Server()

server.method({
  name: 'foo',
  handler(params, cb) {
    cb(null, 'bar')
  }
})

server.connection(/* options */)

server.start(() => console.log('server started'))
```

* if no `validate` config is passed then any params should be valid

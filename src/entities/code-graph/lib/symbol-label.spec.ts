import { describe, expect, it } from 'vitest'
import { fileBase, symbolLabel } from './symbol-label'

describe('symbolLabel', () => {
  it('splits a PHP method into call name and class', () => {
    expect(symbolLabel({ kind: 'method', name: 'placeOrder', fqn: 'App\\Services\\CheckoutService::placeOrder' })).toEqual({
      name: 'placeOrder()',
      owner: 'CheckoutService'
    })
  })

  it('splits a Go method into call name and type', () => {
    expect(symbolLabel({ kind: 'method', name: 'Create', fqn: 'example.com/shop/orders.(*Service).Create' })).toEqual({
      name: 'Create()',
      owner: 'Service'
    })
    expect(symbolLabel({ kind: 'method', name: 'Save', fqn: 'example.com/app/svc.S.Save' })).toEqual({ name: 'Save()', owner: 'S' })
  })

  it('names a function by its namespace or package', () => {
    expect(symbolLabel({ kind: 'function', name: 'helper', fqn: 'App\\Support\\helper' })).toEqual({ name: 'helper()', owner: 'App\\Support' })
    expect(symbolLabel({ kind: 'function', name: 'main', fqn: 'example.com/app/cmd.main' })).toEqual({ name: 'main()', owner: 'cmd' })
  })

  it('keeps types and files without brackets', () => {
    expect(symbolLabel({ kind: 'class', name: 'OrdersClient', fqn: 'App\\Clients\\OrdersClient' })).toEqual({
      name: 'OrdersClient',
      owner: 'App\\Clients'
    })
    expect(symbolLabel({ kind: 'file', name: 'routes/web.php', fqn: 'routes/web.php' })).toEqual({ name: 'web.php', owner: 'routes' })
  })

  it('shows an external call by its full name', () => {
    expect(symbolLabel({ kind: 'external', name: 'post', fqn: 'GuzzleHttp\\Client::post' })).toEqual({ name: 'post()', owner: 'Client' })
  })
})

describe('fileBase', () => {
  it('takes the last path part', () => {
    expect(fileBase('app/Services/Checkout/CheckoutService.php')).toBe('CheckoutService.php')
  })
})

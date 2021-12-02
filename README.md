# SmartConnections

This project is an application for [this Gitcoin bounty](https://gitcoin.co/issue/cyberconnecthq/cyberconnect-arweave/1/100027167). The connections are stored on-chain using a [`Smartweave`](https://github.com/ArweaveTeam/SmartWeave) smart contract.

## Usage

`Smartweave` provides different methods of interaction with the contract's data:

1) [`readContract`](https://github.com/ArweaveTeam/SmartWeave/blob/master/SDK.md#readcontract)
    basically just returns the contract's state at the current (or passed) height. This is useful, because unlike the other methods, this one doesn't require passing a wallet since it simply reads out the current state without any further computation.
2) [`interactRead`](https://github.com/ArweaveTeam/SmartWeave/blob/master/SDK.md#interactread) also reads the contract, but this method requires passing a wallet and input, since it computes the output based on these parameters. This is very useful however, if we don't want the contract's state in the format it is saved in on the chain, which will be further elaborated on later.
3) [`interactWrite`](https://github.com/ArweaveTeam/SmartWeave/blob/master/SDK.md#interactwrite) is the most interesting one, if you will, since this method allows writing the (connection) data to be written to the contract's state. This is also the only method of the three that requires a private wallet, since this is the only one that actually costs Ar to use.

### `readContract`

This smart contract's state's format is as follows:
```typescript
type State = {
    owners: string[],
    namespaces: {
        [namespace: string]: string[]
    },
    connections: {
        [address: string]: {
            [target: string]: {
                [namespace: string]: {
                    [connectionType: string]: {
                        createdAt: number,
                        alias: string | null
                    }
                }
            }
        }
    }
}
```
`owners`: An array of addresses with access to configuration methods **(unchangable)**

`namespaces`: An object containing the namespaces and their respective connection types

`connections`: nested objects, keyed by each parameter a connection can have. This format makes it easier to process the write calls, but it might not be the preferred format when actually working with the data. That's why, alternatively to the basic `readContract()` option of retrieving the data, there are two more:

### `interactRead`

#### `followings`

Calling the contract with the input `{function: "followings"}` will return all followings an address has as an array, keyed by the following address.

Input:

```typescript
input = {
    function: "followings",
    target?: string,
    namespace?: string
}
```
`target`: Only this address' followings are returned (optional)

`namespace`: Only followings in this namespace are returned (optional)

Output:

```typescript
{
    [origin: string]: [{
        connectionType: string,
        target: string,
        namespace: string,
        createdAt: Number,
        alias: string | null
        },
    ]
}
```
#### `followers`

Calling the contract with the input `{function: "followers"}` will return all followers an address has as an array, keyed by the address that is being followed.

Input:

```typescript
input = {
    function: "followers",
    target?: string,
    namespace?: string
}
```
`target`: Only this address' followings are returned (optional)

`namespace`: Only followings in this namespace are returned (optional)

Output:

```typescript
{
    [followed: string]: [{
        connectionType: string,
        origin: string,
        namespace: string,
        createdAt: Number,
        alias: string | null
        },
    ]
}
```
### `interactWrite`

#### `follow`

This method allows the calling address to follow a target address on a specific namespace with a specific connection type.

Input:

```typescript
input = {
    function: "follow",
    target: string,
    namespace: string,
    connectionType: string,
    alias?: string
}
```

`target`: The address to connected to

`namespace`: The namespace the connection is in

`connectionType`: The connection type of this connection

`alias`: An alias for this connection (optional)

#### `unfollow`

This method allows the calling address to delete previously established followings. If no parameters are passed, delete all followings.

Input:

```typescript
input = {
    function: "unfollow",
        target?: string,
        namespace?: string,
        connectionType?: string
}
```

`target`: The address to disconnected from (optional)

`namespace`: The namespace the connection is in (optional)

`connectionType`: The connection type of the connection (optional)

`alias`: An alias for this connection (optional)

#### `addNamespaces`

This method allows addresses that are members of the `owners` group of addresses to add namespaces to this contract's state.

Input:

```typescript
input = {
    function: "addNamespaces",
    namespaces: {
        [namespace: string]: string[]
    }
}
```

`namespaces`: An object containing the namespaces as keys and their respective connection types as values

#### `addConnectionTypes`

This method allows addresses that are members of the `owners` group of addresses to add connection types to an already present namespace.

Input:

```typescript
input = {
    function: "addConnectionTypes",
    namespace: string,
    connectionTypes: string[]
}
```

`namespace`: The namespace to add the connection types to

`connectionTypes`: An array of connection types
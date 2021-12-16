# SmartConnections

This project is an application for [this Gitcoin bounty](https://gitcoin.co/issue/cyberconnecthq/cyberconnect-arweave/1/100027167). The connections are stored on-chain using a [`Smartweave`](https://github.com/ArweaveTeam/SmartWeave) smart contract. The contract is live on the arweave with the ID `8zsrYKY_ZD9MJZcYjjpq4rajA2WGPAWrrq6IdfL4GnM`, the source has the TxID `3yLz25dBkgp-y1O2F6dCpUT-U5ctSw4oj29rFPIzxLI`. A basic frontend that reads out the connections and sorts them by most recent can be found [here](https://6girr2rsd7zpm4rhtgvu65j37dvmnathequeardatecjlznnnu6q.arweave.net/8ZEY6jIf8vZyJ5mrT3U7-OrGgmckKEBEYJkEleWtbT0/). More info on that app on [this branch](https://github.com/TarekJ03/SmartConnections/tree/web).

## Philosophy and approach

This smart contract is very user-centered in the way the methods work. Connections can only be altered by their owners, the address that called the contract for this specific interaction. Even though there is a list of addresses with privileged write access in `owners`, the only special access those have is to extend the already present namespaces and connection types. This is there to control the addition of new namespaces and connection types. As a protection mechanism, the `owners` cannot be changed as to not introduce multiple levels of privilege. All of this means that there's unrestricted read access to this smart contract's data, however, extremely limited write access which guarantees the safety and permanence (until requested removal) of the stored data. Due to the underlying technology, each address pays for its own connections. This price is very low (currently, and also [expected to be so in the future](https://www.arweave.org/technology#endowment)), however, it isn't zero, which hopefully makes users more mindful of their digital footprint.

## Why `Smartweave`

`Smartweave` allows storing the data on the Arweave network. The way it works makes extending the contracts very easy for two reasons:

1) The contract's source is stored on-chain as well, which means that any `Smartweave` contract is inherently open-source, even if its development isn't (unlike this project)
2) Any contract that's deployed on the chain already can also be called as the source for a new contract with a new initial state
   - This mechanic also means that in the unlikely event of a breaking bug the contract's source can be adapted, re-deployed and continue working with the old contract's state


You can find more information on the way `Smartweave` evaluates contracts and how you can interact with them on the project's [github page](https://github.com/ArweaveTeam/SmartWeave) or in these blog entries: [[1](https://cedriking.medium.com/lets-buidl-smartweave-contracts-6353d22c4561)] [[2](https://cedriking.medium.com/lets-buidl-smartweave-contracts-2-16c904a8692d)]

## Setup

To initiate a new instance of this smart contract, follow these steps:

1. Install `Smartweave` (if not already installed):

	```bash
	npm install -g smartweave
	```

2. Write an initial `state.json`:

	```JSON
	{
	  owners: ["owner1", "owner2"],
	  namespaces: {
	    "namespace1": ["method1", "method2"],
	    "namespace2": ["method1", "method2"]
	  },
	  connections: {}
	}
	```

3. Create a new contract:

     ```bash
     smartweave 3yLz25dBkgp-y1O2F6dCpUT-U5ctSw4oj29rFPIzxLI path/to/state.json --key-file path/to/keyfile
	```

## Usage

Simplified explanations of the different methods of interaction with the contract's data `Smartweave` provides:

1) [`readContract`](https://github.com/ArweaveTeam/SmartWeave/blob/master/SDK.md#readcontract) basically just returns the contract's state at the current (or passed) height. This is useful, because unlike the other methods, this one doesn't require passing a wallet since it simply reads out the current state without any further computation.
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
        [origin: string]: {
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
`owners`: An array of addresses with access to configuration methods **(unchangable once deployed)**

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
output = {
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
output = {
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

**Important notice: Writing data to the Arweave chain like these methods do costs Ar. The price is calculated from the input data's size and can be obtained from https://arweave.net/price/{input_data_size}**

#### `follow`

This method allows the calling address to follow a target address in a specific namespace with a specific connection type.

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

`target`: The address to connect to

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

This method allows addresses that are members of the `owners` group to add namespaces to this contract's state.

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

This method allows addresses that are members of the `owners` group to add connection types to an already present namespace.

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
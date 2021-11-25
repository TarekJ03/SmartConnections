function handle(state, action){

    // Initialize all variables
    const caller = action.caller;
    const func = action.input.function
    const target = action.input.target
    const namespace = action.input.namespace
    const connectionType = action.input.connectionType
    const alias = "alias" in action.input ? action.input.alias : null

    if (func){
        // Check if target is a valid input
        if (!target){
            throw new ContractError("Adding a connection requires the target to connect to");
        } if (typeof target !== "string"){
            throw new ContractError("Target needs to be a string");
        }
        switch (func) {
            case "connect":
                 if (target == caller){
                    throw new ContractError("You can't follow your own address")
                } if (caller in state && target in state[caller] && namespace in state[caller][target] && alias == state[caller][target][alias]){
                    throw new ContractError(`Target ${target} has already been connected to on ${namespace}${alias ? " as "+alias : ""}`);
                } if (!connectionType){
                    throw new ContractError("Adding a connection requires the connection type")
                } if (state[caller] && state[caller][target]){
                    state[caller][target][namespace] = {
                            "connectionType": connectionType,
                            "createdAt": Date.now(),
                            "alias": alias
                            }
                } else if (state[caller]){
                    state[caller][target] = {
                        [namespace]: {
                            "connectionType": connectionType,
                            "createdAt": Date.now(),
                            "alias": alias
                        }
                    }
                } else {
                    state[caller] = {
                        [target]: {
                            [namespace]: {
                                "connectionType": connectionType,
                                "createdAt": Date.now(),
                                "alias": alias
                            }
                        }
                    }
                }
                return state
            case "disconnect":
                 if (!target in state[caller]){
                    throw new ContractError(`Target ${target} has not been connected to`);
                } if (!namespace in state[caller][target]){
                    throw new ContractError(`Target ${target} has not been connected to on ${namespace}`)
                }
                delete state[caller][target][namespace]
                state[caller][target] == {} ? delete state[caller][target] : {}
                return state
            case "lookup":
                if (!target in state){
                    throw new ContractError(`Address ${target} is not registered here`)
                } else if (!state[target]){
                    return []
                }
                connections = Object.keys(state[target]).flatMap(address => {
                    return Object.keys(state[target][address]).flatMap(namespace => {
                        return {
                        "ConnectionType": state[target][address][namespace]["connectionType"],
                        "target": address,
                        "namespace": namespace,
                        "createdAt": state[target][address][namespace]["createdAt"],
                        "alias": state[target][address][namespace]["alias"]
                        }
                    })
                })
                return connections
            default:
                throw new ContractError(`${func} is not a valid function identifier. Available functions: addConnection, deleteConnection, lookup`)
        }
    } else {
        throw new ContractError("There needs to be a passed func")
    }
}
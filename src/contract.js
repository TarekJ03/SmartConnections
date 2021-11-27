async function handle(state, action){

    // Initialize all variables
    const caller = action.caller;
    const func = action.input.function
    const target = action.input.target
    const namespace = action.input.namespace
    const connectionType = action.input.connectionType
    const alias = "alias" in action.input ? action.input.alias : null

    if (func && typeof func == "string"){
        // Check if target is a valid input, if required
        if (func !== "lookup" && !target){
            throw new ContractError(`The "${func}" function requires a target`);
        } if (func !== "lookup" && typeof target !== "string"){
            throw new ContractError("Target needs to be a string");
        }
        switch (func) {
            case "connect":
                if (!(namespace && connectionType) || !(typeof namespace == "string" && typeof connectionType == "string") || target == caller || alias && typeof alias !== "string") {
                    throw new ContractError(`Invalid input: ${action.input}`)
                } if (!(await SmartWeave.arweave.wallets.getLastTransactionID(target))) {
                    throw new ContractError(`Address ${target} does not appear to have had any transactions, so we can't validate if it's a real address`)
                } if (caller in state && target in state[caller] && namespace in state[caller][target] && alias && alias == state[caller][target][namespace][alias]){
                    throw new ContractError(`Target ${target} has already been connected to on ${namespace}${alias ? " as " + alias : ""}`);
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
                    state[caller.toString()] = {
                        [target]: {
                            [namespace]: {
                                "connectionType": connectionType,
                                "createdAt": Date.now(),
                                "alias": alias
                            }
                        }
                    }
                }
                return { state }
            case "disconnect":
                 if (!(target in state[caller])){
                    throw new ContractError(`Target ${target} has not been connected to`);
                } if (!(namespace in state[caller][target])){
                    throw new ContractError(`Target ${target} has not been connected to on ${namespace}`)
                }
                delete state[caller][target][namespace]
                state[caller][target] == {} ? delete state[caller][target] : {}
                return { state }
            case "lookup":
                function iterateOverConnections(target) {
                    // Returns all connections of a given target
                    return Object.keys(state[target]).flatMap(address => {
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
                } if (target) {
                    if (!(target in state)){
                        throw new ContractError(`Address ${target} is not connected to any address`)
                    } else if (!state[target]){
                        return { result: [] }
                    }
                    // If there's one target and it's connected to addresses, return this address' connections
                    const connections = {[target]: iterateOverConnections(target)}
                    return { result: connections }
                } else {
                    // If no target is passed, return all connections
                    const initalObject = {}
                    return {result: Object.fromEntries(Object.keys(state).map(target => [target, iterateOverConnections(target)]))}
                }
            default:
                throw new ContractError(`${func} is not a valid function identifier. Available functions: addConnection, deleteConnection, lookup`)
        }
    } else {
        throw new ContractError("There needs to be a passed function")
    }
}
// demonstrates how to simultaneously trigger multiple async calls
// and wait for them while triggering actions after each one finishes

// get a random number of ms between min and max # of seconds
const rndMs = (min_sec: number, max_sec: number) => Math.floor(
    (   // random number between min and max
        Math.random() * (max_sec - min_sec) + min_sec
    ) * 1000 // convert to milliseconds
) + 1

// simulate an api call that takes between 1 and 5 seconds to return
const simulateApiCall = (id: number): Promise<{id: number, result: string}> =>
    new Promise((resolve) => setTimeout(
        () => resolve({ id, result: id.toString() }), rndMs(1, 5)
    ))

// function to wait for enter key
const waitForInput = () => new Promise((resolve) => process.stdin.once('data', v => {
    resolve(v)
    process.stdin.pause() // pause input so we don't get stuck waiting for input
}))

// simulate x api calls simultaneously but log every time one finishes
// without blocking the rest of the calls
const simulateApiCalls = async (apiCallCount: number): Promise<string[]> => {
    // initiate all api calls and save them in an array of trackabale state objects
    const apiResultStates = [...Array(apiCallCount).keys()] // create x ids
        .map(id => ({
            id,                           // how we know which call is which
            promise: simulateApiCall(id), // the promise for this particular call
            complete: false,              // whether the call finished
            result: '',                   // where we'll store the result
        }))

    let apiCallsCompleted = 0
    // while there are uncompleted api calls
    while (apiCallsCompleted < apiCallCount) {
        // wait first the next promise to complete
        const { id, result } = await Promise.race(
            apiResultStates.filter(p => !p.complete).map(p => p.promise) // only wait for incomplete items
        )

        // retrieve object that finished and update it
        const finishedStateObj = apiResultStates.find(p => p.id === id)
        if (!finishedStateObj) throw new Error('This should never happen')
        finishedStateObj.complete = true
        finishedStateObj.result = result

        // track the completion and log the result
        apiCallsCompleted++
        console.log(`Finished (${apiCallsCompleted}/${apiCallCount})`)
    }

    return apiResultStates.map(p => p.result)
}

simulateApiCalls(10)
    .then(async results => {
        console.log('done; press enter to show results')
        await waitForInput()
        return results
    })
    .then(results => console.log(results))
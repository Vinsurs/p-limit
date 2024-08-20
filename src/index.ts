type PLimitOptions = {
    concurrency?: number;
    retry?: boolean;
    retryCount?: number;
    tick?: (running: number) => any;
};
/**
 * run promise-based tasks concurrently with limitation
 * @param promisedTasks tasks that promise-returned
 * @param options promise limit options
 * @returns {void}
 */
export function pLimit(promisedTasks: Array<() => Promise<any>>, options?: PLimitOptions) {
    if (promisedTasks.length === 0) return;
    const def: PLimitOptions = { concurrency: 6, retry: true, retryCount: promisedTasks.length };
    const _options = Object.assign({}, def, options || {}) as Required<PLimitOptions>;
    let running = 0;
    let retried = 0;
    function run(task: () => Promise<any>) {
        return task()
        .finally(() => {
            running--;
            tick();
            hook();
        })
        .catch(() => {
            if (_options.retry && retried < _options.retryCount) {
                retried++;
                promisedTasks.push(task);
                hook();
            }
        });
    }
    function hook() {
        if (running < _options.concurrency) {
            const next = promisedTasks.shift();
            if (next) {
                run(next);
                running++;
                tick();
                hook();
            }
        }
    }
    function tick() {
        if (_options.tick && typeof _options.tick === 'function') {
            _options.tick(running);
        }
    }
    hook();
}
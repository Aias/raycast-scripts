import pLimit from 'p-limit';

// Default concurrency for OpenAI API calls
const DEFAULT_CONCURRENCY = 10;

/**
 * Process items in parallel with a concurrency limit (pool pattern).
 * As each task completes, the next one starts immediately.
 *
 * @param items - Array of items to process
 * @param processor - Async function to process each item
 * @param options - Configuration options
 * @returns Array of results in the same order as input items
 */
export async function processWithPool<T, R>(
	items: T[],
	processor: (item: T, index: number) => Promise<R>,
	options: {
		concurrency?: number;
		fallback?: (item: T, index: number, error: unknown) => R;
		onProgress?: (completed: number, total: number) => void;
	} = {},
): Promise<R[]> {
	const { concurrency = DEFAULT_CONCURRENCY, fallback, onProgress } = options;
	const limit = pLimit(concurrency);
	let completed = 0;

	const tasks = items.map((item, index) =>
		limit(async () => {
			try {
				const result = await processor(item, index);
				completed++;
				onProgress?.(completed, items.length);
				return result;
			} catch (error) {
				completed++;
				onProgress?.(completed, items.length);
				if (fallback) {
					console.warn(`  ⚠️ Task ${index + 1} failed, using fallback`);
					return fallback(item, index, error);
				}
				throw error;
			}
		}),
	);

	return Promise.all(tasks);
}

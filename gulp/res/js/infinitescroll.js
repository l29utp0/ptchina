(() => {
	'use strict';

  // Early return if not on a board page
	if (typeof window.boardConfig === 'undefined') {
		return;
	}

  // Configuration
	const config = {
		boardId: window.boardConfig.boardId,
		currentPage: window.boardConfig.currentPage,
		maxPage: window.boardConfig.maxPage,
		modview: window.boardConfig.modview,
		loading: false,
		loadMoreThreshold: 1,
		loadedPages: new Set([window.boardConfig.currentPage]),
	};

  // Extract post data from HTML element
	function extractPostData(postElement) {
		const postData = {
			postId: postElement.dataset.postId,
			board: config.boardId,
			thread: postElement.dataset.thread || null,
			files: Array.from(postElement.querySelectorAll('.post-file')).map(
				(f) => ({
					hash: f.dataset.hash,
					hasThumb: f.dataset.hasThumb === 'true',
					thumbextension: f.dataset.thumbextension,
					filename: f.dataset.filename,
				}),
			),
			quotes: [],
			backlinks: [],
			crossquotes: [],
		};

    // Extract quotes from links in the post
		const quoteLinks = postElement.querySelectorAll('a.quote');
		postData.quotes = Array.from(quoteLinks)
			.map((link) => {
				const quoteMatch = link
					.getAttribute('href')
					.match(/\/thread\/(\d+)\.html#(\d+)$/);
				if (quoteMatch) {
					return {
						postId: parseInt(quoteMatch[2], 10),
						thread: parseInt(quoteMatch[1], 10),
						board: config.boardId,
					};
				}
				return null;
			})
			.filter((q) => q !== null);

		return postData;
	}

  // Check if we're near the bottom of the page
	function isNearBottom() {
		return (
			window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - config.loadMoreThreshold
		);
	}

  // Load more content
	async function loadMore() {
		if (config.loading || config.currentPage >= config.maxPage) {
			return;
		}

		const nextPage = config.currentPage + 1;
		if (config.loadedPages.has(nextPage)) {
			return;
		}

		config.loading = true;
		const loadingIndicator = document.querySelector('.loading-indicator');
		if (loadingIndicator) {
			loadingIndicator.style.display = 'block';
		}

		try {
			const url = `/${config.boardId}/${nextPage === 1 ? 'index' : nextPage}.html`;
			const response = await fetch(url, {
				headers: {
					'x-using-xhr': '1',
				},
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const html = await response.text();
			const tempDiv = document.createElement('div');
			tempDiv.innerHTML = html;

      // Get all threads from the response
			const newThreads = tempDiv.querySelectorAll('.thread');
			if (newThreads.length > 0) {
				const threadsContainer = document.querySelector(
					'#threads-container .thread-form',
				);
				const bottomPages = threadsContainer.querySelector(
					'.pages.bottom-pages',
				);
				const pages = threadsContainer.querySelector('nav.pages');

        // Insert new threads before either the nav.pages or div.pages.bottom-pages elements
        // but only if they exist in the threadsContainer
				newThreads.forEach((thread) => {
					const clone = thread.cloneNode(true);
					const referenceNode = pages || bottomPages;
					if (referenceNode && referenceNode.parentNode === threadsContainer) {
						threadsContainer.insertBefore(clone, referenceNode);
					} else {
            // If neither element exists in the correct container, append to the end
						threadsContainer.appendChild(clone);
					}

          // Process each post in the thread
					const posts = clone.querySelectorAll('.post-container');
					posts.forEach((post) => {
						const postData = extractPostData(post);

            // Create and dispatch addPost event
						const postEvent = new CustomEvent('addPost', {
							detail: {
								post: post,
								postId: postData.postId,
								hover: false,
								nonotify: true,
								loaded: true,
								json: postData,
							},
						});
						window.dispatchEvent(postEvent);
					});
				});

				const hr = document.createElement('hr');
				hr.setAttribute('size', '1');
				threadsContainer.insertBefore(hr, pages || bottomPages);

				config.loadedPages.add(nextPage);
				config.currentPage = nextPage;
			}
		} catch (error) {
			console.error('Error loading more content:', error);
		} finally {
			config.loading = false;
			if (loadingIndicator) {
				loadingIndicator.style.display = 'none';
			}
		}
	}

  // Add CSS for loading indicator
	const style = document.createElement('style');
	style.textContent = `
    .loading-indicator {
        text-align: center;
        padding: 20px;
        display: none;
        animation: pulse 1s ease-in-out infinite;
    }
    #threads-container {
        position: relative;
    }
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.3; }
        100% { opacity: 1; }
    }
`;
	document.head.appendChild(style);

  // Scroll event listener with debounce
	let scrollTimeout;
	window.addEventListener('scroll', () => {
		if (scrollTimeout) {
			clearTimeout(scrollTimeout);
		}
		scrollTimeout = setTimeout(() => {
			if (isNearBottom()) {
				loadMore();
			}
		}, 100);
	});

  // Initial check in case the page is too short
	if (isNearBottom()) {
		loadMore();
	}
})();

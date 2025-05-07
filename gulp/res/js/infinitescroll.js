/* global newPost */
(() => {
	'use strict';

	// Variable declarations
	let scrollListener = null;
	let scrollTimeout;

	// LocalStorage access independent of boardConfig
	const isEnabled = localStorage.getItem('infinitescroll') !== 'false';

	// Function to enable/disable infinite scroll - safely callable from any page
	function setInfiniteScrollActive(active) {
		// Only perform scroll listening operations on board pages
		if (typeof window.boardConfig === 'undefined') {
			// Just store the setting in localStorage when not on a board page
			// The setting will be applied when user visits a board page
			return;
		}

		if (active && !scrollListener) {
			attachScrollListener();
		} else if (!active && scrollListener) {
			detachScrollListener();
		}
	}

	// Expose the function to toggle infinite scroll for the settings change
	window.setInfiniteScrollActive = setInfiniteScrollActive;

	// Allow toggle setting to still work even if not on a board page
	window.addEventListener('DOMContentLoaded', () => {
		const infiniteScrollSetting = document.getElementById('infinitescroll-setting');

		if (infiniteScrollSetting) {
			infiniteScrollSetting.checked = isEnabled;
			infiniteScrollSetting.addEventListener('change', () => {
				const newSetting = infiniteScrollSetting.checked;
				localStorage.setItem('infinitescroll', newSetting);
				console.log('toggling infinite scroll', newSetting);
				// Safe to call from any page - function has guard clauses
				window.setInfiniteScrollActive(newSetting);
			});
		}
	});

	// Early return if not on a board page
	if (typeof window.boardConfig === 'undefined') {
		return;
	}

	// Configuration - only used on board pages
	const config = {
		boardId: window.boardConfig.boardId,
		currentPage: window.boardConfig.currentPage,
		maxPage: window.boardConfig.maxPage,
		modview: window.boardConfig.modview,
		loading: false,
		loadMoreThreshold: 1,
		loadedPages: new Set([window.boardConfig.currentPage]),
	};

	// Loading state tracking for omitted expand
	let loading = {};

	// Reference for hover cache list tracking
	const hoverCacheList = {
		value: Object.keys(localStorage).filter(k => k.startsWith('hovercache')),
		update() {
			this.value = Object.keys(localStorage).filter(k => k.startsWith('hovercache'));
		}
	};

	// Check if we're near the bottom of the page
	function isNearBottom() {
		return (
			window.innerHeight + window.scrollY >=
			document.documentElement.scrollHeight - config.loadMoreThreshold
		);
	}

	// Function to attach the scroll listener
	function attachScrollListener() {
		if (scrollListener) { return; } // Don't attach if already attached

		scrollListener = () => {
			if (scrollTimeout) {
				clearTimeout(scrollTimeout);
			}
			scrollTimeout = setTimeout(() => {
				if (isNearBottom()) {
					loadMore();
				}
			}, 100);
		};

		window.addEventListener('scroll', scrollListener);

		// Initial check in case the page is too short
		if (isNearBottom()) {
			loadMore();
		}
	}

	// Function to detach the scroll listener
	function detachScrollListener() {
		if (scrollListener) {
			window.removeEventListener('scroll', scrollListener);
			scrollListener = null;
		}
	}

	// Functions for handling omitted posts expansion
	const hideOmitted = (e) => {
		e.target.nextSibling.style.display = 'unset';
		const thread = e.target.closest('.thread');
		const posts = Array.from(thread.querySelectorAll('.post-container'));
		let replies = posts.slice(1);
		if (e.target.dataset.shown > 0) {
			replies = replies.slice(0, -parseInt(e.target.dataset.shown));
		}
		replies.forEach(r => {
			r.previousSibling.remove();
			r.remove();
		});
		e.target.removeAttribute('data-open');
		e.target.src = '/file/plus.png';
	};

	const expandOmitted = async (e) => {
		const threadId = e.target.dataset.thread;
		const board = e.target.dataset.board;
		const parentPost = e.target.closest('.post-container');
		const firstPreviewReply = parentPost.nextSibling && parentPost.nextSibling.nextSibling;
		const jsonPath = `/${board}/thread/${threadId}.json`;

		let hovercache = localStorage.getItem(`hovercache-${jsonPath}`);
		let replies;
		if (hovercache) {
			hovercache = JSON.parse(hovercache);
			if (firstPreviewReply && hovercache.replies.find(r => r.postId == firstPreviewReply.dataset.postId)) {
				replies = hovercache.replies;
			}
		}
		if (!replies) {
			e.target.style.cursor = 'wait';
			e.target.classList.add('spin');
			let json;
			try {
				if (!loading[jsonPath]) {
					loading[jsonPath] = fetch(jsonPath).then(res => res.json());
				}
				json = await loading[jsonPath];
			} catch (e) {
				console.error(e);
				return;
			} finally {
				e.target.style.cursor = '';
				e.target.classList.remove('spin');
				delete loading[jsonPath];
			}
			if (json) {
				try {
					localStorage.setItem(`hovercache-${jsonPath}`, JSON.stringify(json));
					hoverCacheList.update();
				} catch (e) {
					console.error('Error setting localStorage:', e);
					// Attempt to clear cache to make room
					const hoverCaches = Object.keys(localStorage).filter(k => k.startsWith('hovercache'));
					for (let i = 0; i < hoverCaches.length && i < 5; i++) {
						localStorage.removeItem(hoverCaches[i]);
					}
					// Try again
					try {
						localStorage.setItem(`hovercache-${jsonPath}`, JSON.stringify(json));
					} catch (e) {
						console.error('Failed to save to localStorage even after clearing some items:', e);
					}
				}
				replies = [...json.replies];
			} else {
				localStorage.removeItem(`hovercache-${jsonPath}`);
				return;
			}
		}
		if (!replies) {
			return;
		}

		const opReplies = parentPost.querySelector('.replies');
		if (opReplies && opReplies.innerText.includes('+')) {
			const earlierLink = opReplies.lastElementChild;
			earlierLink.previousSibling.remove();
			earlierLink.remove();
		}
		replies = replies.reverse();
		e.target.nextSibling.style.display = 'none';
		e.target.src = '/file/minus.png';
		e.target.dataset.open = true;
		if (firstPreviewReply) {
			replies = replies.filter(r => r.postId < firstPreviewReply.dataset.postId);
		}
		replies.forEach(r => {
			newPost(r, {
				nonotify: true,
				insertPoint: firstPreviewReply ? parentPost.nextSibling : parentPost,
				insertPosition: firstPreviewReply ? 'beforebegin' : 'afterend',
			});
		});
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

				// Insert new threads and initialize their functionality
				newThreads.forEach((thread) => {
					const clone = thread.cloneNode(true);
					const referenceNode = pages || bottomPages;
					if (referenceNode && referenceNode.parentNode === threadsContainer) {
						threadsContainer.insertBefore(clone, referenceNode);
					} else {
						threadsContainer.appendChild(clone);
					}

					// Initialize expand-omitted buttons for the new thread
					const expandButtons = clone.getElementsByClassName('expand-omitted');
					for (let i = 0; i < expandButtons.length; i++) {
						expandButtons[i].addEventListener('click', function(e) {
							if (e.target.dataset.open) {
								hideOmitted(e);
							} else {
								expandOmitted(e);
							}
						}, false);
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

	// Initialize the scroll listener based on the current setting
	setInfiniteScrollActive(isEnabled);
})();

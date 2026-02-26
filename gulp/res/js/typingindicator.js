/* globals socket isThread */

window.addEventListener('DOMContentLoaded', () => {

	if (!isThread || !socket) {
		return;
	}

	const messageBox = document.getElementById('message');
	const typingWarning = document.querySelector('#typing-indicator-bottom .typing-warning');
	const typingDots = document.querySelector('#typing-indicator-bottom .typing-dots');

	if (!messageBox || !typingWarning || !typingDots) {
		return;
	}

	const typingUsers = new Map();
	let typingTimeout = null;
	let isCurrentlyTyping = false;

	const getRoomId = () => {
		const pathParts = window.location.pathname.replace(/\.html$/, '').split('/');
		return pathParts.length >= 4 ? `${pathParts[1]}-${pathParts[3]}` : null;
	};

	const room = getRoomId();
	const clientId = Math.random().toString(36).substr(2, 9);

	if (!room) return;

	// Handle typing - works on both desktop and mobile
	const handleTyping = () => {
		const hasText = messageBox.value.trim().length > 0;

		if (!isCurrentlyTyping && hasText) {
			isCurrentlyTyping = true;
			socket.emit('userTyping', {
				room: room,
				clientId: clientId
			});
		}

		clearTimeout(typingTimeout);

		if (hasText) {
			typingTimeout = setTimeout(() => {
				if (isCurrentlyTyping) {
					isCurrentlyTyping = false;
					socket.emit('userStoppedTyping', {
						room: room,
						clientId: clientId
					});
				}
			}, 5000);
		} else {
			if (isCurrentlyTyping) {
				isCurrentlyTyping = false;
				socket.emit('userStoppedTyping', {
					room: room,
					clientId: clientId
				});
			}
		}
	};

	// Desktop + Mobile
	messageBox.addEventListener('input', handleTyping);

	// Mobile keyboard events
	messageBox.addEventListener('keydown', handleTyping);
	messageBox.addEventListener('keyup', handleTyping);

	// Mobile composition events (for predictive text, emoji, etc.)
	messageBox.addEventListener('compositionstart', handleTyping);
	messageBox.addEventListener('compositionend', handleTyping);

	// Android soft keyboard
	messageBox.addEventListener('change', handleTyping);

	if (messageBox.form) {
		messageBox.form.addEventListener('submit', () => {
			if (isCurrentlyTyping) {
				isCurrentlyTyping = false;
				socket.emit('userStoppedTyping', {
					room: room,
					clientId: clientId
				});
			}
			typingUsers.clear();
			updateDisplay();
		});
	}

	// Stop typing when user leaves the page
	window.addEventListener('beforeunload', () => {
		if (isCurrentlyTyping) {
			socket.emit('userStoppedTyping', {
				room: room,
				clientId: clientId
			});
		}
	});

	// Stop typing when navigating away (SPA navigation)
	window.addEventListener('pagehide', () => {
		if (isCurrentlyTyping) {
			socket.emit('userStoppedTyping', {
				room: room,
				clientId: clientId
			});
		}
	});

	socket.on('userIsTyping', (data) => {
		if (data.clientId === clientId) {
			return;
		}
		typingUsers.set(data.clientId, {
			timestamp: data.timestamp
		});
		updateDisplay();
	});

	socket.on('userStoppedTyping', (data) => {
		typingUsers.delete(data.clientId);
		updateDisplay();
	});

	const updateDisplay = () => {
		const now = Date.now();
		for (const [userId, userData] of typingUsers.entries()) {
			if (now - userData.timestamp > 5000) {
				typingUsers.delete(userId);
			}
		}

		if (typingUsers.size > 0) {
			typingWarning.style.display = 'block';
			typingDots.style.animation = 'pulse 1s ease-in-out infinite';
		} else {
			typingWarning.style.display = 'none';
			typingDots.style.animation = 'none';
		}
	};

});

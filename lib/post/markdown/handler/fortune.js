'use strict';

const fortunes = [
	'ｷﾀ━━━━━━(ﾟ∀ﾟ)━━━━━━ !!!!',
	'（　´_ゝ`）ﾌｰﾝ',
	'ヾ(⌐■_■)ノ♪',
	'Má sorte',
	'Boa sorte',
	'Tenta outra vez',
	'Mais ou menos',
	'Não vais ter nada e vais gostar',
	'Vais comer os insetos',
	'Verdadeiro',
	'Falso',
	'Volta',
	'Toma os comprimidos',
//sortes de ptchina gold
];

module.exports = {

	fortunes,

	regex: /##sorte/mi,

	markdown: () => {
		const randomFortune = fortunes[Math.floor(Math.random()*fortunes.length)];
		return `<span class='sorte'>Sorte: ${randomFortune}</span>`;
	},

};

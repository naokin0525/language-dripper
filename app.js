/**
 * Conlang Generator Application
 *
 * Refactored by a Principal Frontend Engineer to meet modern web standards for
 * performance, security, accessibility, and maintainability.
 *
 * Key Improvements:
 * - Security: Replaced all `innerHTML` assignments with safe DOM manipulation methods
 *   (textContent, createElement, appendChild) to prevent XSS vulnerabilities.
 * - Performance: Implemented `DocumentFragment` for bulk DOM updates to minimize
 *   reflow/repaint cycles. Utilized event delegation for dynamically added elements.
 * - Accessibility: Added ARIA attributes (`aria-label`, `aria-valuetext`) to ensure
 *   controls are understandable for screen reader users.
 * - Maintainability: Organized code into a clear module pattern with distinct
 *   responsibilities (State, Logic, UI Management). Refactored initialization
 *   into discrete, well-named functions.
 */
(() => {
	"use strict";

	// --- 1. STATE MANAGEMENT ---
	// Centralized state object for the entire application
	const languageState = {
		phonology: {
			consonants: [],
			vowels: [],
			syllableStructures: [],
			phonologicalRules: [],
			tones: {
				enabled: false,
				count: 3,
			},
		},
		lexicon: {
			semanticFields: [],
			rootCount: 100,
			loanwords: {
				enabled: false,
			},
		},
		morphoSyntax: {
			wordOrder: "SOV",
			adjectiveOrder: "AN",
			caseMarking: "suffix",
			irregularityRate: 0.05,
			derivationalMorphemes: [],
			grammaticalGender: "none",
			genderAgreement: false,
		},
		generated: {
			dictionary: [],
			grammar: {
				subjectMarker: "ga",
				objectMarker: "wo",
				pluralMarker: "t",
				tenses: {
					past: "ta",
					present: "ru",
					future: "lu",
				},
			},
		},
	};

	// --- 2. DOM ELEMENT CACHE ---
	// This will be populated by UIManager.cacheDOMElements()
	const UI = {};

	// --- 3. CORE LOGIC MODULES ---

	/**
	 * Phonology Module: Handles sound systems and word generation.
	 */
	const Phonology = {
		ipaToRomanMap: {
			p: "p", t: "t", k: "k", b: "b", d: "d", g: "g", m: "m", n: "n",
			s: "s", z: "z", h: "h", r: "r", j: "y", w: "w", a: "a", i: "i",
			u: "u", e: "e", o: "o", ʃ: "sh", ʧ: "ch", ʤ: "j", ŋ: "ng",
			θ: "th", ð: "dh", "¹": "¹", "²": "²", "³": "³", "⁴": "⁴", "⁵": "⁵",
			"⁶": "⁶", "⁷": "⁷", "⁸": "⁸", "⁹": "⁹",
		},

		romanize(ipaStr) {
			return Array.from(ipaStr)
				.map((char) => this.ipaToRomanMap[char] || char)
				.join("");
		},

		generateWord() {
			const { consonants, vowels, syllableStructures, tones } =
				languageState.phonology;
			if (
				consonants.length === 0 ||
				vowels.length === 0 ||
				syllableStructures.length === 0
			)
				return null;

			const structure =
				syllableStructures[
					Math.floor(Math.random() * syllableStructures.length)
				];
			let word = "";
			for (const char of structure) {
				if (char === "C") {
					word += consonants[Math.floor(Math.random() * consonants.length)];
				} else if (char === "V") {
					word += vowels[Math.floor(Math.random() * vowels.length)];
				}
			}

			let finalWord = this.applyPhonologicalRules(word);

			if (tones.enabled) {
				const tone = Math.floor(Math.random() * tones.count) + 1;
				const toneMarker = String.fromCodePoint(0x2070 + tone);
				finalWord += toneMarker;
			}
			return finalWord;
		},

		applyPhonologicalRules(word) {
			let newWord = word;
			languageState.phonology.phonologicalRules.forEach((rule) => {
				try {
					const [match, replacement] = rule.from.split(">").map((s) => s.trim());
					const context = rule.to;
					let regex;
					if (context.includes("_")) {
						const [before, after] = context.split("_");
						const regexBefore = before ? `(?<=${before.replace("V", `[${languageState.phonology.vowels.join("")}]`)})` : "";
						const regexAfter = after ? `(?=${after.replace("V", `[${languageState.phonology.vowels.join("")}]`)})` : "";
						regex = new RegExp(`${regexBefore}${match}${regexAfter}`, "g");
					} else {
						regex = new RegExp(match, "g");
					}
					newWord = newWord.replace(regex, replacement);
				} catch (e) {
					console.error("Invalid phonological rule:", rule, e);
				}
			});
			return newWord;
		},

		sourceLoanwords: [
			"computer", "internet", "phone", "radio", "television", "music", "art",
			"game", "food", "water",
		],

		_findClosestSound(sound, candidates, inventory) {
			for (const candidate of candidates) {
				if (inventory.includes(candidate)) {
					return candidate;
				}
			}
			return inventory.length > 0 ? inventory[0] : "";
		},

		assimilate(word) {
			const { consonants, vowels } = languageState.phonology;
			if (consonants.length === 0 || vowels.length === 0) return word;
			const soundMap = {
				p: this._findClosestSound("p", ["p", "b", "f"], consonants),
				b: this._findClosestSound("b", ["b", "p", "v"], consonants),
				t: this._findClosestSound("t", ["t", "d", "s"], consonants),
				d: this._findClosestSound("d", ["d", "t", "z"], consonants),
				k: this._findClosestSound("k", ["k", "g", "h", "x"], consonants),
				c: this._findClosestSound("k", ["k", "g", "s"], consonants),
				g: this._findClosestSound("g", ["g", "k", "ʤ"], consonants),
				f: this._findClosestSound("f", ["f", "p", "v"], consonants),
				v: this._findClosestSound("v", ["v", "b", "f"], consonants),
				s: this._findClosestSound("s", ["s", "z", "t", "ʃ"], consonants),
				z: this._findClosestSound("z", ["z", "s", "d"], consonants),
				m: this._findClosestSound("m", ["m", "n"], consonants),
				n: this._findClosestSound("n", ["n", "m", "ŋ"], consonants),
				l: this._findClosestSound("l", ["l", "r", "j"], consonants),
				r: this._findClosestSound("r", ["r", "l", "d"], consonants),
				h: this._findClosestSound("h", ["h"], consonants),
				j: this._findClosestSound("ʤ", ["ʤ", "g", "z"], consonants),
				y: this._findClosestSound("j", ["j", "i"], [...consonants, ...vowels]),
				w: this._findClosestSound("w", ["w", "u"], [...consonants, ...vowels]),
				q: this._findClosestSound("k", ["k", "g"], consonants),
				x: this._findClosestSound("s", ["s", "z"], consonants),
				a: this._findClosestSound("a", ["a", "e", "o"], vowels),
				e: this._findClosestSound("e", ["e", "i", "a"], vowels),
				i: this._findClosestSound("i", ["i", "e", "u"], vowels),
				o: this._findClosestSound("o", ["o", "u", "a"], vowels),
				u: this._findClosestSound("u", ["u", "o", "i"], vowels),
			};
			return Array.from(word.toLowerCase())
				.map((char) => soundMap[char] || "")
				.join("");
		},
	};

	/**
	 * Lexicon Module: Handles dictionary creation and management.
	 */
	const Lexicon = {
		semanticFieldMap: {
			自然: "nature", 動物: "animals", 感情: "emotions", 行動: "actions",
			道具: "tools", 社会: "society", 思考: "concepts", 身体: "body",
			食物: "food", 場所: "places",
		},

		SemanticDictionary: {
			nature: [
				"sun", "moon", "star", "sky", "earth", "sea", "river", "mountain", "tree",
				"flower", "rain", "wind", "snow", "fire", "water", "stone", "cloud",
				"forest", "desert", "island", "valley", "lightning", "sand"
			],
			animals: [
				"dog", "cat", "bird", "fish", "horse", "bear", "wolf", "lion", "tiger",
				"snake", "insect", "spider", "eagle", "mouse", "cow", "sheep",
				"monkey", "deer", "fox", "rabbit", "bee", "butterfly"
			],
			emotions: [
				"love", "hate", "joy", "sadness", "anger", "fear", "surprise", "hope",
				"pride", "shame", "calm", "anxiety", "courage", "desire", "trust",
				"pity", "envy", "gratitude", "guilt", "curiosity"
			],
			actions: [
				"go", "come", "eat", "drink", "sleep", "see", "hear", "speak", "run",
				"walk", "give", "take", "make", "do", "know", "think", "love", "work",
				"play", "sing", "die", "live", "fight", "read", "write"
			],
			tools: [
				"knife", "hammer", "axe", "rope", "wheel", "boat", "net", "needle",
				"sword", "shield", "bow", "arrow", "pen", "book", "cup", "pot", "key",
				"clock", "mirror", "lamp", "plow", "cart", "bridge", "road"
			],
			society: [
				"person", "man", "woman", "child", "family", "king", "queen", "law",
				"war", "peace", "city", "house", "village", "god", "money", "art",
				"music", "story", "name", "word", "language", "friend", "enemy", "chief"
			],
			concepts: [
				"time", "space", "life", "death", "good", "evil", "truth", "lie",
				"beauty", "power", "knowledge", "freedom", "justice", "luck", "dream",
				"soul", "mind", "idea", "change", "order", "chaos", "number"
			],
			body: [
				"head", "face", "eye", "ear", "nose", "mouth", "hand", "foot", "heart",
				"blood", "bone", "skin", "hair", "voice", "leg", "arm", "finger", "tooth"
			],
			food: [
				"bread", "meat", "fruit", "seed", "salt", "honey", "milk", "egg",
				"root", "leaf", "berry", "grain", "wine", "oil", "cheese", "herb"
			],
			places: [
				"home", "market", "temple", "field", "cave", "port", "castle",
				"tower", "wall", "gate", "tomb", "throne", "garden", "lake", "shore"
			],
		},

		generate() {
			const { rootCount, semanticFields, loanwords } = languageState.lexicon;
			const newDictionary = [];
			const pos = ["noun", "verb", "adjective"];
			const generatedRomans = new Set();
			const usedMeanings = new Set();

			const meaningsToGenerate = [];
			let fieldIndex = 0;
			while (meaningsToGenerate.length < rootCount) {
				const fieldName = semanticFields[fieldIndex % semanticFields.length];
				const fieldKey = this.semanticFieldMap[fieldName];

				if (fieldKey && this.SemanticDictionary[fieldKey]) {
					const availableWords = this.SemanticDictionary[fieldKey].filter(w => !usedMeanings.has(w));
					if (availableWords.length > 0) {
						const chosenMeaning = availableWords[Math.floor(Math.random() * availableWords.length)];
						meaningsToGenerate.push(chosenMeaning);
						usedMeanings.add(chosenMeaning);
					}
				} else {
					if (!usedMeanings.has(fieldName)) {
						meaningsToGenerate.push(fieldName);
						usedMeanings.add(fieldName);
					}
				}
				fieldIndex++;
				if (fieldIndex > rootCount * 2 && meaningsToGenerate.length < rootCount) break;
			}

			for (const meaning of meaningsToGenerate) {
				let ipa, roman;
				let attempts = 0;
				do {
					ipa = Phonology.generateWord();
					if (!ipa) break;
					roman = Phonology.romanize(ipa);
					attempts++;
				} while (generatedRomans.has(roman) && attempts < 10);

				if (!ipa || generatedRomans.has(roman)) continue;
				generatedRomans.add(roman);

				const wordPos = pos[Math.floor(Math.random() * pos.length)];
				const word = {
					ipa: `/${ipa}/`, roman, pos: wordPos, meaning: meaning, gender: null,
				};

				if (word.pos === "noun" && languageState.morphoSyntax.grammaticalGender !== "none") {
					const genders = languageState.morphoSyntax.grammaticalGender === "mf"
						? ["masculine", "feminine"]
						: ["masculine", "feminine", "neuter"];
					word.gender = genders[Math.floor(Math.random() * genders.length)];
				}
				newDictionary.push(word);
			}

			const derivedWords = [];
			const { irregularityRate } = languageState.morphoSyntax;
			languageState.morphoSyntax.derivationalMorphemes.forEach((morpheme) => {
				newDictionary.forEach((word) => {
					if (Math.random() < 0.5) {
						if (Math.random() < irregularityRate) {
							const vowels = languageState.phonology.vowels;
							if (vowels.length > 0) {
								const baseIpa = word.ipa.slice(1, -1);
								const randomVowel = vowels[Math.floor(Math.random() * vowels.length)];
								const lastVowelIndex = Array.from(baseIpa).map((c, i) => (vowels.includes(c) ? i : -1)).filter((i) => i !== -1).pop();
								if (lastVowelIndex !== undefined) {
									let newIpa = Array.from(baseIpa);
									newIpa[lastVowelIndex] = randomVowel;
									newIpa = newIpa.join("");
									derivedWords.push({
										ipa: `/${newIpa}/`,
										roman: Phonology.romanize(newIpa),
										pos: morpheme.func,
										meaning: `${word.meaning} (irregular ${morpheme.func})`,
										gender: word.gender,
									});
								}
							}
						} else {
							const newWord = MorphoSyntax.applyDerivation(word, morpheme);
							if (newWord) derivedWords.push(newWord);
						}
					}
				});
			});

			languageState.generated.dictionary = [...newDictionary, ...derivedWords];

			if (loanwords.enabled) {
				const loanwordCount = Math.max(1, Math.floor(rootCount * 0.05));
				for (let i = 0; i < loanwordCount; i++) {
					const sourceWord = Phonology.sourceLoanwords[Math.floor(Math.random() * Phonology.sourceLoanwords.length)];
					const assimilatedIpa = Phonology.assimilate(sourceWord);
					const assimilatedRoman = Phonology.romanize(assimilatedIpa);

					if (assimilatedRoman && !languageState.generated.dictionary.some((w) => w.roman === assimilatedRoman)) {
						languageState.generated.dictionary.push({
							ipa: `/${assimilatedIpa}/`,
							roman: assimilatedRoman,
							pos: "noun",
							meaning: `${sourceWord} (loanword)`,
							gender: null,
						});
					}
				}
			}
		},
	};

	/**
	 * Morphology and Syntax Module
	 */
	const MorphoSyntax = {
		applyDerivation(word, morpheme) {
			let newIpa, newRoman;
			const baseIpa = word.ipa.slice(1, -1);
			if (morpheme.type === "prefix") {
				newIpa = morpheme.form + baseIpa;
				newRoman = Phonology.romanize(morpheme.form) + word.roman;
			} else {
				newIpa = baseIpa + morpheme.form;
				newRoman = word.roman + Phonology.romanize(morpheme.form);
			}
			return {
				ipa: `/${newIpa}/`, roman: newRoman, pos: morpheme.func,
				meaning: `${word.meaning} (${morpheme.func})`,
			};
		},

		generateSentence() {
			const { dictionary } = languageState.generated;
			const { genderAgreement, grammaticalGender, wordOrder, caseMarking, adjectiveOrder } = languageState.morphoSyntax;

			const nouns = dictionary.filter((w) => w.pos === "noun");
			const verbs = dictionary.filter((w) => w.pos === "verb");
			const adjectives = dictionary.filter((w) => w.pos === "adjective");

			if (nouns.length < 2 || verbs.length < 1) return "辞書に単語が不足しています。";

			const subject = { ...nouns[Math.floor(Math.random() * nouns.length)] };
			let object = { ...nouns[Math.floor(Math.random() * nouns.length)] };
			while (object.roman === subject.roman) {
				object = { ...nouns[Math.floor(Math.random() * nouns.length)] };
			}
			const verb = { ...verbs[Math.floor(Math.random() * verbs.length)] };

			let subjectPhrase = subject.roman;
			let humanReadableSubject = subject.meaning;

			if (adjectives.length > 0 && Math.random() > 0.5) {
				const adjective = { ...adjectives[Math.floor(Math.random() * adjectives.length)] };
				let adjectiveForm = adjective.roman;

				if (genderAgreement && grammaticalGender !== "none" && subject.gender) {
					let suffix = "";
					if (subject.gender === "masculine") suffix = "o";
					else if (subject.gender === "feminine") suffix = "a";
					else if (subject.gender === "neuter") suffix = "e";
					if (suffix) adjectiveForm += `-${suffix}`;
				}

				if (adjectiveOrder === "AN") {
					subjectPhrase = `${adjectiveForm} ${subject.roman}`;
				} else {
					subjectPhrase = `${subject.roman} ${adjectiveForm}`;
				}
				humanReadableSubject = `${adjective.meaning} ${subject.meaning}`;
			}

			const { subjectMarker, objectMarker, tenses } = languageState.generated.grammar;
			let s_final = subjectPhrase;
			let o_final = object.roman;

			switch (caseMarking) {
				case "suffix":
					s_final = s_final + "-" + subjectMarker;
					o_final = o_final + "-" + objectMarker;
					break;
				case "prefix":
					s_final = subjectMarker + "-" + s_final;
					o_final = objectMarker + "-" + o_final;
					break;
				case "postposition":
					s_final = s_final + " " + subjectMarker;
					o_final = o_final + " " + objectMarker;
					break;
			}

			const tenseKeys = Object.keys(tenses);
			const randomTenseKey = tenseKeys[Math.floor(Math.random() * tenseKeys.length)];
			const tenseMarker = tenses[randomTenseKey];
			const v_final = verb.roman + "-" + tenseMarker;

			const components = { S: s_final, O: o_final, V: v_final };
			const orderedSentence = wordOrder.split("").map((c) => components[c]).join(" ");

			return `${orderedSentence}. ('The ${humanReadableSubject} ${verb.meaning} (${randomTenseKey}) the ${object.meaning}')`;
		},
	};

	// --- 4. UI MANAGEMENT MODULE ---
	const UIManager = {
		init() {
			this.cacheDOMElements();
			this.bindEventListeners();
			this.updateStateFromUI();
			this.handleGenerateLexicon();
		},

		cacheDOMElements() {
			const ids = [
				"consonants", "vowels", "syllable-structure", "tones-enabled", "tones-controls",
				"tones-count", "tones-count-value", "phonology-rules-list", "add-phonology-rule",
				"semantic-fields", "lexicon-size", "loanwords-enabled", "generate-lexicon",
				"word-order", "adjective-order", "irregularity-rate", "irregularity-rate-value",
				"derivational-morphemes-list", "add-morpheme", "grammar-summary",
				"example-sentences", "export-json", "export-csv", "gender-agreement",
			];
			ids.forEach((id) => {
				const camelCaseId = id.replace(/-(\w)/g, (_, c) => c.toUpperCase());
				UI[camelCaseId] = document.getElementById(id);
			});

			UI.lexiconTableBody = document.querySelector("#lexicon-table tbody");
			UI.presetBtns = document.querySelectorAll("[data-preset]");
			UI.caseMarking = document.querySelectorAll('input[name="case-marking"]');
			UI.grammaticalGender = document.querySelectorAll('input[name="grammatical-gender"]');
		},

		bindEventListeners() {
			const controlsToListen = [
				UI.consonants, UI.vowels, UI.syllableStructure, UI.semanticFields, UI.lexiconSize,
				UI.wordOrder, UI.adjectiveOrder, UI.tonesEnabled, UI.loanwordsEnabled, UI.genderAgreement,
			];
			controlsToListen.forEach((el) =>
				el.addEventListener("input", () => {
					this.updateStateFromUI();
					this.updateAllDisplays();
				})
			);

			UI.caseMarking.forEach((el) => el.addEventListener("change", () => this.handleInputChange()));
			UI.grammaticalGender.forEach((el) => el.addEventListener("change", () => this.handleInputChange()));
			UI.presetBtns.forEach((el) => el.addEventListener("click", (e) => this.handlePresetClick(e)));
			UI.tonesCount.addEventListener("input", (e) => this.handleTonesToggle(e));
			UI.irregularityRate.addEventListener("input", (e) => this.handleIrregularityRate(e)));
			UI.generateLexicon.addEventListener("click", () => this.handleGenerateLexicon());
			UI.addPhonologyRule.addEventListener("click", () => this.addDynamicInput("phonologyRule")));
			UI.addMorpheme.addEventListener("click", () => this.addDynamicInput("morpheme")));
			UI.exportJson.addEventListener("click", () => this.exportJSON());
			UI.exportCsv.addEventListener("click", () => this.exportCSV());
			UI.phonologyRulesList.addEventListener("click", (e) => this.handleDynamicRemove(e));
			UI.derivationalMorphemesList.addEventListener("click", (e) => this.handleDynamicRemove(e));
			UI.phonologyRulesList.addEventListener("input", () => this.handleInputChange());
			UI.derivationalMorphemesList.addEventListener("input", () => this.handleInputChange());
		},

		updateStateFromUI() {
			languageState.phonology.consonants = UI.consonants.value.trim().split(/\s+/);
			languageState.phonology.vowels = UI.vowels.value.trim().split(/\s+/);
			languageState.phonology.syllableStructures = UI.syllableStructure.value.trim().split(",").map((s) => s.trim().toUpperCase());
			languageState.phonology.tones.enabled = UI.tonesEnabled.checked;
			languageState.phonology.tones.count = parseInt(UI.tonesCount.value, 10);
			languageState.lexicon.semanticFields = UI.semanticFields.value.trim().split(",");
			languageState.lexicon.rootCount = parseInt(UI.lexiconSize.value, 10);
			languageState.lexicon.loanwords.enabled = UI.loanwordsEnabled.checked;
			languageState.morphoSyntax.wordOrder = UI.wordOrder.value;
			languageState.morphoSyntax.adjectiveOrder = UI.adjectiveOrder.value;
			languageState.morphoSyntax.caseMarking = document.querySelector('input[name="case-marking"]:checked').value;
			languageState.morphoSyntax.grammaticalGender = document.querySelector('input[name="grammatical-gender"]:checked').value;
			languageState.morphoSyntax.genderAgreement = UI.genderAgreement.checked;
			languageState.morphoSyntax.irregularityRate = parseInt(UI.irregularityRate.value, 10) / 100;

			languageState.phonology.phonologicalRules = [];
			document.querySelectorAll(".phonology-rule-item").forEach((item) => {
				const from = item.querySelector(".rule-from").value;
				const to = item.querySelector(".rule-to").value;
				if (from && to) languageState.phonology.phonologicalRules.push({ from, to });
			});

			languageState.morphoSyntax.derivationalMorphemes = [];
			document.querySelectorAll(".morpheme-item").forEach((item) => {
				const type = item.querySelector(".morpheme-type").value;
				const form = item.querySelector(".morpheme-form").value;
				const func = item.querySelector(".morpheme-func").value;
				if (form && func) languageState.morphoSyntax.derivationalMorphemes.push({ type, form, func });
			});
		},

		updateAllDisplays() {
			this.updateGrammarSummary();
			this.updateDictionaryView();
			this.updateExampleSentences();
		},

		getMorphologicalTypology() {
			const { derivationalMorphemes, irregularityRate } = languageState.morphoSyntax;
			const morphemeCount = derivationalMorphemes.length;
			if (morphemeCount === 0) return { type: "孤立語 (Isolating)", desc: "各単語が不変で、文法関係は語順によって示される傾向があります。（例: 中国語、ベトナム語）" };
			if (morphemeCount > 2 && irregularityRate < 0.08) return { type: "膠着語 (Agglutinative)", desc: "語根に接辞が次々と付加され、各接辞が単一の文法機能を持つ傾向があります。（例: 日本語、トルコ語）" };
			if (morphemeCount > 0 && irregularityRate >= 0.08) return { type: "屈折語 (Fusional)", desc: "接辞が複数の文法機能を同時に担い、不規則な変化が多い傾向があります。（例: ラテン語、ロシア語）" };
			return { type: "分析語 (Analytic)", desc: "文法機能の多くを独立した単語（助詞など）や語順で示す傾向があります。" };
		},

		updateGrammarSummary() {
			const { phonology, morphoSyntax, generated } = languageState;
			UI.grammarSummary.textContent = "";
			const fragment = document.createDocumentFragment();
			const createSection = (title) => {
				const h4 = document.createElement("h4");
				h4.className = "text-lg font-semibold mt-4 mb-2 border-b border-gray-700";
				h4.textContent = title;
				fragment.appendChild(h4);
				const ul = document.createElement("ul");
				ul.className = "list-disc list-inside space-y-1";
				fragment.appendChild(ul);
				return ul;
			};
			const addItem = (ul, label, value) => {
				const li = document.createElement("li");
				const b = document.createElement("b");
				b.textContent = `${label}: `;
				li.appendChild(b);
				li.appendChild(document.createTextNode(value));
				ul.appendChild(li);
			};

			const typologyUl = createSection("類型論的特徴");
			const morphologyType = this.getMorphologicalTypology();
			addItem(typologyUl, "形態論的類型", `${morphologyType.type} - ${morphologyType.desc}`);
			const adpositionType = morphoSyntax.wordOrder === "SOV" || morphoSyntax.caseMarking === "postposition" ? "後置詞言語 (Postpositional)" : "前置詞言語 (Prepositional)";
			addItem(typologyUl, "接置詞", adpositionType);

			const syntaxUl = createSection("統語論 (Syntax)");
			addItem(syntaxUl, "基本語順", morphoSyntax.wordOrder);
			const adjOrderMap = { AN: "形容詞 + 名詞", NA: "名詞 + 形容詞" };
			addItem(syntaxUl, "形容詞の語順", adjOrderMap[morphoSyntax.adjectiveOrder]);

			const morphologyUl = createSection("形態論 (Morphology)");
			const caseMarkingMap = { suffix: "接尾辞", prefix: "接頭辞", postposition: "後置詞" };
			addItem(morphologyUl, "格標示", `主格: -${generated.grammar.subjectMarker}, 目的格: -${generated.grammar.objectMarker} (${caseMarkingMap[morphoSyntax.caseMarking]})`);
			addItem(morphologyUl, "名詞の数", `複数形: -${generated.grammar.pluralMarker}`);
			const tenses = Object.entries(generated.grammar.tenses).map(([k, v]) => `${k}: -${v}`).join(', ');
			addItem(morphologyUl, "動詞の時制", tenses);
			const genderMap = { none: "なし", mf: "男性/女性", mfn: "男性/女性/中性" };
			addItem(morphologyUl, "文法性", `${genderMap[morphoSyntax.grammaticalGender]} (${morphoSyntax.genderAgreement ? "一致あり" : "一致なし"})`);
			addItem(morphologyUl, "不規則性", `${Math.round(morphoSyntax.irregularityRate * 100)}%`);

			const phonologyUl = createSection("音韻論 (Phonology)");
			addItem(phonologyUl, "音素", `${phonology.consonants.length}子音, ${phonology.vowels.length}母音`);
			addItem(phonologyUl, "音節構造", phonology.syllableStructures.join(", "));
			const toneSummary = phonology.tones.enabled ? `あり (${phonology.tones.count}種)` : "なし";
			addItem(phonologyUl, "声調", toneSummary);

			UI.grammarSummary.appendChild(fragment);
		},

		updateDictionaryView() {
			const { dictionary } = languageState.generated;
			const tableBody = UI.lexiconTableBody;
			tableBody.textContent = "";
			const fragment = document.createDocumentFragment();
			dictionary.forEach((word) => {
				const row = document.createElement("tr");
				row.insertCell().textContent = word.ipa;
				row.insertCell().textContent = word.roman;
				row.insertCell().textContent = word.pos;
				row.insertCell().textContent = word.meaning;
				row.insertCell().textContent = word.gender || "—";
				fragment.appendChild(row);
			});
			tableBody.appendChild(fragment);
		},

		updateExampleSentences() {
			UI.exampleSentences.textContent = "";
			for (let i = 0; i < 3; i++) {
				const p = document.createElement("p");
				p.textContent = MorphoSyntax.generateSentence();
				UI.exampleSentences.appendChild(p);
			}
		},

		addDynamicInput(type) {
			const div = document.createElement("div");
			div.className = "flex gap-2 items-center mb-2";

			if (type === "phonologyRule") {
				div.classList.add("phonology-rule-item");
				const fromInput = document.createElement("input");
				fromInput.type = "text"; fromInput.className = "rule-from w-1/3"; fromInput.placeholder = "n > m";
				const toInput = document.createElement("input");
				toInput.type = "text"; toInput.className = "rule-to w-1/3"; toInput.placeholder = "_p";
				const removeBtn = document.createElement("button");
				removeBtn.type = "button"; removeBtn.className = "btn btn-secondary text-sm remove-btn"; removeBtn.textContent = "X";
				removeBtn.setAttribute("aria-label", "このルールを削除");
				div.append(fromInput, document.createTextNode(" / "), toInput, removeBtn);
				UI.phonologyRulesList.appendChild(div);
			} else if (type === "morpheme") {
				div.classList.add("morpheme-item");
				const typeSelect = document.createElement("select");
				typeSelect.className = "morpheme-type w-1/4";
				["prefix", "suffix"].forEach((val) => {
					const opt = document.createElement("option");
					opt.value = val; opt.textContent = val === "prefix" ? "接頭辞" : "接尾辞";
					typeSelect.appendChild(opt);
				});
				const formInput = document.createElement("input");
				formInput.type = "text"; formInput.className = "morpheme-form w-1/4"; formInput.placeholder = "例: un-";
				const funcInput = document.createElement("input");
				funcInput.type = "text"; funcInput.className = "morpheme-func w-1/4"; funcInput.placeholder = "例: 否定";
				const removeBtn = document.createElement("button");
				removeBtn.type = "button"; removeBtn.className = "btn btn-secondary text-sm remove-btn"; removeBtn.textContent = "X";
				removeBtn.setAttribute("aria-label", "この接辞を削除");
				div.append(typeSelect, formInput, funcInput, removeBtn);
				UI.derivationalMorphemesList.appendChild(div);
			}
		},

		handleInputChange() { this.updateStateFromUI(); this.updateAllDisplays(); },
		handleTonesToggle(event) {
			const isEnabled = UI.tonesEnabled.checked;
			UI.tonesControls.classList.toggle("hidden", !isEnabled);
			const value = UI.tonesCount.value;
			UI.tonesCount.setAttribute("aria-valuetext", value);
			UI.tonesCountValue.textContent = value;
			this.handleInputChange(event);
		},
		handleIrregularityRate(event) {
			const value = event.target.value;
			UI.irregularityRate.setAttribute("aria-valuetext", `${value}%`);
			UI.irregularityRateValue.textContent = `${value}%`;
			this.handleInputChange(event);
		},
		handlePresetClick(event) {
			const preset = event.target.dataset.preset;
			const presets = {
				japanese: { consonants: "p t k b d g m n s z h r j w", vowels: "a i u e o", structure: "CV,V,CVN" },
				english: { consonants: "p t k b d g m n l r s z ʃ ʒ h w j θ ð f v ʧ ʤ", vowels: "i ɪ e æ u ʊ o ɔ a ɑ ə", structure: "CVC,CCV,CV,V,VCC" },
				spanish: { consonants: "p t k b d g m n l r s j w f x", vowels: "a e i o u", structure: "CV,CVC,VC" },
			};
			if (presets[preset]) {
				UI.consonants.value = presets[preset].consonants;
				UI.vowels.value = presets[preset].vowels;
				UI.syllableStructure.value = presets[preset].structure;
				this.handleInputChange();
			}
		},
		handleGenerateLexicon() {
			this.updateStateFromUI();
			Lexicon.generate();
			this.updateAllDisplays();
		},
		handleDynamicRemove(event) {
			if (event.target.classList.contains("remove-btn")) {
				event.target.closest(".phonology-rule-item, .morpheme-item").remove();
				this.handleInputChange();
			}
		},
		download(filename, text) {
			const element = document.createElement("a");
			element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
			element.setAttribute("download", filename);
			element.style.display = "none";
			document.body.appendChild(element);
			element.click();
			document.body.removeChild(element);
		},
		exportJSON() {
			const dataToExport = {
				grammar: languageState.morphoSyntax,
				phonology: languageState.phonology,
				lexicon: languageState.generated.dictionary,
				generated_grammar_details: languageState.generated.grammar,
			};
			this.download("language.json", JSON.stringify(dataToExport, null, 2));
		},
		exportCSV() {
			const { dictionary } = languageState.generated;
			let csvContent = "ipa,roman,pos,meaning,gender\n";
			dictionary.forEach((word) => {
				const row = [word.ipa, word.roman, word.pos, word.meaning, word.gender || ""];
				csvContent += row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",") + "\n";
			});
			this.download("lexicon.csv", csvContent);
		},
	};

	// --- 5. INITIALIZATION ---
	function initializeApp() { UIManager.init(); }
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initializeApp);
	} else {
		initializeApp();
	}
})();

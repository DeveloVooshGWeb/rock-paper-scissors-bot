const dotenv = require("dotenv");
dotenv.config();

const token = process.env.token || "";

const { nanoid } = require("nanoid");

const prefix = "!";
const commands = ["rps"];
const funcs = {};
const games = {};

const { Client, IntentsBitField } = require("discord.js");
const client = new Client({ intents: new IntentsBitField(3276799) });

const btnTypes = ["Rock", "Paper", "Scissors"];

const defBtnData = [
	{ type: 2, label: btnTypes[0], style: 2, custom_id: "_1" },
	{ type: 2, label: btnTypes[1], style: 1, custom_id: "_2" },
	{ type: 2, label: btnTypes[2], style: 4, custom_id: "_3" }
]

const nomIndexes = {};
const noms = [
	`Please Provide An Opponent!`,
	`**Please Provide An Opponent!**`,
	`**PLEASE PROVIDE AN OPPONENT!**`,
	`...`,
	`**...**`,
	`I Already Said That You Need An Opponent.`,
	`You Can't Fight "No One"!`,
	`I Can't Start A Game If I Don't Know Who You Want To Fight!`,
	`I Give Up! **JUST PROVIDE AN OPPONENT!**`
]

function createBtnData(id) {
	let btnData = [];
	defBtnData.forEach(data => {
		let newData = { type: data.type, label: data.label, style: data.style, custom_id: `${id}${data.custom_id}` };
		btnData.push(newData);
	})
	return btnData;
}

function genId() {
	let id = nanoid();
	if (!games.hasOwnProperty(id)) return id;
	return genId();
}

client.on("ready", () => {
	console.log("RPS Bot Started.");
	console.log("Waiting For Games...");
})

client.on("messageCreate", (message) => {
	if (message.author.bot) return;
	commands.every((command) => {
		let fullCommand = prefix + command;
		if (message.content.startsWith(fullCommand)) {
			funcs[`_${command}`](message.content.substring(fullCommand.length + 1), message);
		}
		return true;
	})
})

client.on("interactionCreate", (interaction) => {
	if (interaction.isButton()) {
		interaction.deferUpdate();
		
		let gameId = interaction.customId.substring(0, interaction.customId.length - 2);
		let btnId = parseInt(interaction.customId[interaction.customId.length - 1]);
		
		if (games.hasOwnProperty(gameId)) {
			let ret = false;
			let userId = interaction.user.id;
			let userIdx = -1;
			let peopleIds = games[gameId][1];
			
			for (userIdx = 0; userIdx < peopleIds.length; userIdx++) {
				if (userId == peopleIds[userIdx]) {
					if (games[gameId][3][userIdx]) {
						interaction.user.send(`**You Already Chose ${btnTypes[games[gameId][2][userIdx] - 1]}! \`Game: ${gameId}\`**`).catch((e) => {
							console.log("Cannot DM User... Just Ignoring :D");
						})
						ret = true;
						break;
					}
					
					games[gameId][2][userIdx] = btnId;
					games[gameId][3][userIdx] = true;
				}
			}
			
			if (userIdx < 0) {
				interaction.user.send(`**You Are Not A Part Of Game \`${gameId}\`!**`).catch((e) => {
					console.log("Cannot DM User... Just Ignoring :D");
				})
				return;
			}
			
			if (ret) return;
			
			clearTimeout(games[gameId][5]);
			games[gameId][5] = setTimeout(() => {
				games[gameId][0].edit(`**\`Game Expired Because All Of The Players Weren't Ready!\`**`);
				delete games[gameId];
			}, 10000)
			
			if (!games[gameId][3].includes(false)) {
				let choices = games[gameId][2];
				let winList = games[gameId][3].map(a => !a);
				let winTeam = [];
				let tie = choices.every((c) => c == choices[0]);
				
				let uniqueChoices = [];
				let c1 = 0;
				let c2 = 0;
				let winner = 0;
				
				for (i = 0; i < choices.length; i++) {
					if (!uniqueChoices.includes(choices[i])) uniqueChoices.push(choices[i]);
				}
				
				if (uniqueChoices.length == 2) {
					c1 = uniqueChoices[0];
					c2 = uniqueChoices[1];
					
					if ((c1 == 1 && c2 == 2) || (c1 == 2 && c2 == 3) || (c1 == 3 && c2 == 1)) winner = 1;
					
					let winChoice = winner == 1 ? c2 : c1;
					let loseChoice = winner == 1 ? c1 : c2;
					
					for (i = 0; i < choices.length; i++) {
						winList[i] = choices[i] == winChoice;
						if (winList[i]) {
							winTeam.push(games[gameId][4][i]);
						}
					}
				} else {
					tie = true;
				}
				
				let result = `**\`Tie!\`**`;
				let winnerFormat = `${winTeam.join("")}`;
				
				if (!tie) {
					if (winTeam.length > 1) {
						let lastWinner = winTeam.pop();
						let winnerList = winTea3m.join(", ");
						winnerFormat = `${winnerList} And ${lastWinner}`;
					}
					
					result = `**\`${winnerFormat}\`** Wins!`;
				}

				let cNames = [];
				for (i = 0; i < choices.length; i++) {
					cNames.push(btnTypes[choices[i] - 1]);
				}
					
				choiceResult = cNames.join(" vs ");
				
				console.log(`${tie ? "Tie!" : `${winnerFormat} Wins`} On Game: ${gameId}`);
				games[gameId][0].edit(`${result}\n**\`\`\`${choiceResult}\`\`\`**`);
				
				clearTimeout(games[gameId][5]);
				delete games[gameId];
			}
		} else {
			interaction.user.send(`**Game: \`${gameId}\` Has Already Expired!**`).catch((e) => {
				console.log("Cannot DM User... Just Ignoring :D");
			})
		}
	}
})

client.login(token);

funcs._rps = (rawPeople, message) => {
	rawPeople = rawPeople.trim();
	let people = rawPeople.split(" | ").map(a => a.trim()).filter((a) => a.length > 0);
	
	if (people.length == 0) {
		let channelId = message.channelId;
		if (!nomIndexes.hasOwnProperty(channelId)) nomIndexes[channelId] = 0;
		message.channel.send(`${noms[nomIndexes[channelId]]}`);
		nomIndexes[channelId]++;
		if (nomIndexes[channelId] + 1 > noms.length) nomIndexes[channelId] = 0;
		return;
	}
	
	let peopleIds = [message.author.id];
	let peopleTags = [`${message.author.username}#${message.author.discriminator}`];
	let peopleFound = [true];
	
	for (i = 0; i < people.length; i++) {
		peopleIds.push("");
		peopleTags.push("");
		peopleFound.push(false);
	}

	message.guild.members.cache.each((member) => {
		let user = member.user;
		if (!user.bot) {
			let pIdx = 0;
			let tag = `${user.username}#${user.discriminator}`;
			let found = false;
			
			for (pIdx = 0; pIdx < people.length; pIdx++) {
				let person = people[pIdx].toLowerCase();
				if (found = user.id == person || `<@${user.id}>` == person || user.username.toLowerCase().startsWith(person) || tag.toLowerCase().endsWith(person)) {
					break;
				}
			}
			
			pIdx++;

			if (!peopleTags.includes(tag) && found) {
				peopleIds[pIdx] = user.id;
				peopleTags[pIdx] = tag;
				peopleFound[pIdx] = true;
			}
		}
	})
	
	let foundAll = true;
	
	for (i = 0; i < people.length; i++) {
		let j = i + 1;
		if (!peopleFound[j]) {
			foundAll = false;
			message.channel.send(`**\`${people[i]}\`** Cannot Be Found!\n**\`\`\`Either You Chose Yourself, Chose A Bot Or Chose Someone Who Isn't In The Server!\`\`\`**`);
		}
	}
	
	if (!foundAll) {
		message.channel.send(`\`\`\`Cannot Start The Game If All The Opponent/s Provided Could Not Be Found...\`\`\``);
		return;
	}
	
	let id = genId();
	console.log(`Game: ${id} Created!`);
	
	let vsMessage = peopleTags.map(a => `**\`${a}\`**`).join(" vs ");
	message.channel.send({ ephemeral: true, content: `${vsMessage}\n**\`\`\`(Game ID: ${id})\`\`\`**`, components: [
			{
				type: 1,
				components: createBtnData(id)
			}
		]
	}).then(() => {
		let choices = [0];
		let chose = [false];
		for (i = 0; i < people.length; i++) {
			choices.push(0);
			chose.push(false);
		}
		message.channel.send(`**\`Waiting For Players...\`**`).then((msg) => {
			games[id] = [msg, peopleIds, choices, chose, peopleTags,
				setTimeout(() => {
					console.log(`Game Expired Because All Of The Players Weren't Ready (Game: ${id})`);
					msg.edit(`**\`Game Expired Because All Of The Players Weren't Ready!\`**`);
					delete games[id];
				}, 10000)
			];
		})
	})
}
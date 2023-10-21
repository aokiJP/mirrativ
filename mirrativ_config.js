//入室判断
const a = [];

let time = 0;
let repeat = 0;
let repeatLog = "";
let repeatInterval = 60;

const searchQuery = {
    start: `Mirrativ botを起動しました`,
    1: "1..",
    2: "2..",
    3: "3.."
};

//管理者
const admin = [134433831, 124483865];
//botの名前
const bot = 127677664;

//配信のurl
const broadcast = "124483865";

//path
const executablePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

//discord
const destinationChannelId = '905782690752639008';
const destinationChannelId2 = '1163102139170705408';
const token = 'MTE2MjkyNDc4NDYyNDA4Mjk2NQ.GIvZug.8jk8gh6G9fN17zjOds1u5da-8RGgpAIk2VlreA';

const googleUsername = "amainjp1210pc@gmail.com";
const googlePassword = "beth0203jp";

const chat = "1164116655249563689"

module.exports = { bot, a, broadcast, executablePath, admin, token, destinationChannelId, destinationChannelId2, googlePassword, googleUsername, chat, time, repeat, repeatLog, repeatInterval, searchQuery };
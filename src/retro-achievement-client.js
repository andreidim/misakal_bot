import axios from 'axios';

class RetroAchiCommand {

    constructor(endPoint, key, cmd, args, converter) {

        this.key = key;
        this.endPoint = endPoint;
        this.cmd = cmd;
        this.args = args;
        this.converter = converter;

    }

    build(argValues) {
        let paramJoin = this.endPoint.indexOf("?") < 0 ? '?' : '&';
        let endPoint = this.endPoint;
        endPoint += paramJoin + 'key=' + this.key;
        if (this.args != undefined) {
            this.args.forEach((arg, i) => {
                endPoint += '&' + arg + '=' + argValues[i];
            });
        }

        return endPoint;
    }
    async execCmd(argValues) {
        let response;
        try {
            let query = this.build(argValues);
            console.log("Querying Retro Achievements API: " + query);
            response = await axios.get(query);
            response = response.data;
        } catch (err) {
            logger.error('Http error', err);
            throw err;
        }
        if (this.converter != undefined)
            return this.converter(response);
        return response;

    }
}

export default class RetroAchivClient {


    constructor() {
        const user = 'Inco';
        const ApiKey = 'R030CUCmooaDbVD3eBqFhBCeVop6cShW&user='+user+'&mode=json';
        const ApiKeyNoUser = 'R030CUCmooaDbVD3eBqFhBCeVop6cShW';
        const EndPointRoot = 'https://ra.hfc-essentials.com/';

        this.commands = new Array();

        //Adding TopTen Command
        this.addCommand(new RetroAchiCommand(EndPointRoot + 'top_ten.php', ApiKey, '/top10'));

        this.addCommand(new RetroAchiCommand(EndPointRoot + 'console_id.php', ApiKey, '/consoles'));

        this.addCommand(new RetroAchiCommand(EndPointRoot + 'game_list.php', ApiKey, '/glist', ['console']));

        this.addCommand(new RetroAchiCommand(EndPointRoot + 'game_info.php', ApiKey, '/ginfo', ['game']));

        this.addCommand(new RetroAchiCommand(EndPointRoot + 'game_info_extended.php', ApiKey, '/ginfoext', ['game']));

        this.addCommand(new RetroAchiCommand(EndPointRoot + 'game_progress.php', ApiKey, '/gprog', ['game']));

        this.addCommand(new RetroAchiCommand(EndPointRoot + 'user_progress.php', ApiKey, '/uprog', ['game']));
       
        this.addCommand(
                new RetroAchiCommand(
                     EndPointRoot + 'user_rank.php', ApiKey, 
                     '/rank', ['member'],
                     (x)=> `Your Score: ${x.Score} and Rank: ${x.Rank}`) );

        this.addCommand(new RetroAchiCommand(EndPointRoot + 'user_recent.php', ApiKey, '/recent', ['member', 'game']));

        this.addCommand(new RetroAchiCommand(EndPointRoot + 'user_summary.php?results=10', ApiKey, '/summary', ['member', 'game']));

    }


    addCommand(cmd) {
        this.commands.push(cmd);
    }

    async runCommand(cmd, args) {

        console.log('==>' + cmd + ' args ' + args);
        let raCmd = this.commands.find(x => x.cmd == cmd);
        console.log('==>' + raCmd);
        if (!raCmd) {
            return "Unknown command, please check avalilable command list"
        }

        if (raCmd.args != null && args == null ||
            raCmd.args != null && args.length < raCmd.args.length) {
            return 'Command: ' + raCmd.cmd + ' must have arguments: ' + raCmd.args;
        }
        return await raCmd.execCmd(args);
    }

}


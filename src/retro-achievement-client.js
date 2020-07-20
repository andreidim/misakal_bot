import axios from 'axios';
import repStr from './util.js';


class RetroAchiCommand {

    constructor(endPoint, key, cmd, args, converter) {

        this.key = key;
        this.endPoint = endPoint;
        this.cmd = cmd;
        this.args = args;
        //This property will be populated evertyme build
        //comand is execute.
        this.userArgs = null;
        //Default Converter, just convert JSON in String.
        this.converter = (x) => JSON.stringify(x);
        if (converter)
            this.converter = converter;

    }

    
    build(argValues) {
        let paramJoin = this.endPoint.indexOf("?") < 0 ? '?' : '&';
        let endPoint = this.endPoint;
        endPoint += paramJoin + 'key=' + this.key;
        this.userArgs = {};
        if (this.args != undefined) {
            this.args.forEach((arg, i) => {
                endPoint += '&' + arg + '=' + argValues[i];
                this.userArgs[arg] = argValues[i];
            });
        }
        console.info(JSON.stringify(this.userArgs));
        return endPoint;
    }

    async execCmd(argValues) {
        let response;
        try {
            let query = this.build(argValues);
            console.log("Querying Retro Achievements API: " + query);
            response = await axios.get(query);
            response = response.data;
            response.userArgs = this.userArgs;

        } catch (err) {
            console.error('Http error', err);
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
        const ApiKey = 'R030CUCmooaDbVD3eBqFhBCeVop6cShW&user=' + user + '&mode=json';
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
                  (x) => `${x.userArgs.member} Your Score is ${x.Score} and your Rank is ${x.Rank}`));

        this.addCommand(new RetroAchiCommand(EndPointRoot + 'user_recent.php', ApiKey, '/recent', ['member', 'game']));

        this.addCommand(
               new RetroAchiCommand(EndPointRoot + 'user_summary.php?results=10', ApiKey,
                '/summary', ['member'],
                (x) =>  
                       
                       `<b>${x.userArgs.member} Recently Played:</b> \n ${repStr('_',33) }\n` 
                       + x.RecentlyPlayed.map(x => 
                       `${x.Title}\n Last Played: ${x.LastPlayed}\n ${repStr('_',33) }\n`  ).join(' ') 
                       +  `\n ${repStr('_',33) }\n<b>${x.userArgs.member} Recently Achievements</b> \n ${repStr('_',33) }\n`
                       + Object.values(x.RecentAchievements).flatMap(x => Object.values(x) )
                       .map(x =>  `Achievement ${x.Title} for game ${x.GameTitle}\n points ${x.points}\n ${repStr('_',33) }\n`  ) )  );

                

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


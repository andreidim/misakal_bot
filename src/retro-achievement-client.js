import axios from 'axios';
import repStr from './util.js';
import "core-js/fn/array/flat-map";


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
            if(response == null || response.length == 0)
                return 'No result... Please try again';

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

        this.addCommand(new RetroAchiCommand(EndPointRoot + 'console_id.php', ApiKey, '/consoles',null,
          (x)=> '<b>List of Consoles:</b>\n'+x.console.flatMap(x => x).map(x=> `\n ${x.ID} Console: ${x.Name}`).join(' ') ));

        this.addCommand(new RetroAchiCommand(EndPointRoot + 'game_list.php',
         ApiKey, '/glist', ['console','filter'], 
         (g)=> `<b>Game List Console: ${g.userArgs.console} Search: ${g.userArgs.filter}</b>\n`
                   + g.game.flatMap(x => x)
                         .filter(x=> x.Title.toLowerCase()
                                    .indexOf(g.userArgs.filter.toLowerCase()) > -1)
                                         .map( x => `\nID: ${x.ID} Game: ${x.Title}` ).join(' ') ));
                                         

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
                (x) =>  {
                        let ln = '\n' + repStr('_',33);
                        let output = `<b>${x.userArgs.member} Recently Played:</b>  ${ln }\n` ;
                        let recents =  x.RecentlyPlayed.map(x => `${x.Title}\n Last Played: ${x.LastPlayed} ${ln}\n`).join(' '); 
                        output += recents;

                        let achievments = `${ln}\n\n<b>${x.userArgs.member} Recently Achievements</b> ${ln}\n`;
                        let achivList = Object.values(x.RecentAchievements)
                            .flatMap(x => Object.values(x) )
                                 .map(x =>  
                                      ` ${x.Title}\n for game ${x.GameTitle}\n points ${x.Points} ${ln }\n` );

                        output += achievments + achivList.join(' ');

                        output += `<b>Points:</b> ${x.Points} `;
                        output += `${ln} <b>Pic:</b> <a href='https://retroachievements.org/${x.UserPic}'>Pic</a> `;
                        output += `<b>Status:</b> ${x.Status == 'Offline' ? '&#128308;' :'&#9989;' } `;

                       return output;      
                 } )  );

                

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


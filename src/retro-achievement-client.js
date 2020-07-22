import axios from 'axios';
import repStr from './util.js';
import "core-js/fn/array/flat-map";


class RetroAchiCommand {

    constructor(endPoint, key, cmd, args, converter,description) {

        this.key = key;
        this.endPoint = endPoint;
        this.cmd = cmd;
        this.args = args;
        //This property will be populated evertyme build
        //comand is execute.
        this.userArgs = null;
        //Default Converter, just convert JSON in String.
        this.description = description;
        this.converter = converter;

    }

    
    buildEndpoint(argValues) {

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

   /**
    * This method transforms resp in some other format.
    * Default implementation is to called converter inline function
    * pass as parameter if it was passed, if not return String for the
    * JSON resp.
    * @param {*} resp a JSON object which represents response for this command.
    */
    transform(resp){

      if(this.converter)
           return this.converter(resp);

      return  JSON.stringify(resp);
    }

    async run(argValues) {

        let response;
        try {
            let query = this.buildEndpoint(argValues);
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
      
        return this.transform(response);

    }
} 

/**
 * Summary Command has its own class since transformer
 * function has a considerable amount of code in order
 * to proper format the output.
 */
class RASummaryCommand extends RetroAchiCommand {

    constructor(endPoint, apiKey){

        super(endPoint + 'user_summary.php?results=10',
                apiKey, '/summary', ['member'],null, 
                 'Retrieves summary info about a memember '+
                 'Recently Played Games,Recently Achievements, Status' +
                 ' And Prof. Pic ');

    }

    transform(resp) {

        let ln = '\n' + repStr('_', 33);
        let output = `<b>${resp.userArgs.member} Recently Played:</b>  ${ln}\n`;
        let recents = resp.RecentlyPlayed.map(x => `${x.Title}\n Last Played: ${x.LastPlayed} ${ln}\n`).join(' ');
        output += recents;

        let achievments = `${ln}\n\n<b>${resp.userArgs.member} Recently Achievements</b> ${ln}\n`;
        let achivList = Object.values(resp.RecentAchievements)
            .flatMap(x => Object.values(x))
            .map(x =>
                ` ${x.Title}\n for game ${x.GameTitle}\n points ${x.Points} ${ln}\n`);

        output += achievments + achivList.join(' ');

        output += `<b>Points:</b> ${resp.Points} `;
        output += `${ln}<a href='https://retroachievements.org/${resp.UserPic}'>.</a> \n`;
        output += `<b>Status:</b> ${resp.Status == 'Offline' ? '&#128308;' : '&#9989;'} `;

        return output;

    }

                
}

class RAGlistCommand extends RetroAchiCommand{
    
    constructor(endPoint, apiKey){
       
      super(endPoint + 'game_list.php', apiKey, '/glist', 
                       ['console','filter'], null, 
                        'Retrieves game list given console Id and game name filter' );

    }

      
    
   transform(resp){

       let output= `<b>Game List Console: ${resp.userArgs.console} Search: ${resp.userArgs.filter}</b>\n`;
        output += resp.game.flatMap(x => x)
                 .filter(x=> x.Title.toLowerCase()
                       .indexOf(resp.userArgs.filter.toLowerCase()) > -1)
                               .map( x => `\nID: ${x.ID} Game: ${x.Title}` ).join(' ') ;

      return output;
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
          (x)=> '<b>List of Consoles:</b>\n' + 
                    x.console.flatMap(x => x).map(x=> `\n ${x.ID} Console: ${x.Name}`).join(' ') ));
            
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

         //Resgistering Game List Command which was defined in a separate class.
        this.addCommand(new RAGlistCommand(EndPointRoot, ApiKey));
        //Resgistering Summary Command which was defined in a separate class.
        this.addCommand( new RASummaryCommand(EndPointRoot, ApiKey) );
 
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
            let cmdDesc = raCmd.description != null ? raCmd.description :'';
            return 'Command: ' + raCmd.cmd 
                       + ' must have arguments: <b>' + raCmd.args + '</b>. ' + raCmd.description;
        }
        return await raCmd.run(args);
    }

}


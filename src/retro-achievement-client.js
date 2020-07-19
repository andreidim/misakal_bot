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
    this.endPoint += '&key=' + this.key;
    if (this.args != undefined) {
      this.args.forEach((arg, i) => {
        this.endPoint += '&' + arg + '=' + argValues[i];
      });
    }

    return this.endPoint;
  }
  async execCmd(argValues) {
    let response;
    try {
      response = await axios.get(this.build(argValues));
    } catch (err) {
      logger.error('Http error', err);
    }
    if (!converter)
      return this.converter(response);
    return response;

  }


}

export default  class RetroAchivClient {


  constructor() {
    const ApiKey = 'R030CUCmooaDbVD3eBqFhBCeVop6cShW';
    const EndPointRoot = 'https://ra.hfc-essentials.com/';

    this.commands = new Array();

    //Adding TopTen Command
    this.addCommand(new RetroAchiCommand(EndPointRoot + 'top_ten.php', ApiKey, '/rank', ['user']));

  }


  addCommand(cmd) {
    this.commands.push(cmd);
  }

  runCommand(cmd, args) {
    let raCmd = this.commands.filter(cmd => cmd.cmd == cmd);
    if (!raCmd) {
      return "Unknown command, please check avalilable command list"
    }
    return raCmd.execCmd(args);


  }



}


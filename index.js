const got = require('got');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class DeleteToot{
  constructor(){
    if(process.argv.length < 4) throw "error";

    this.host = process.argv[2];
    this.token = process.argv[3];
  }

  async start(){
    try{
      this.id = await this.get_account_id();
      console.log(`User Info: \n  Host: ${this.host}\n  UserId: ${this.id}`);

      console.log('Start main loop');
      await this.main_loop();
    }catch(err){
      throw(err);
    }
  }

  async main_loop(){
    while(true){
      var post_count = await this.get_post_count();
      if(post_count < 1) break;

      console.log(`Post count: ${post_count}`);

      var posts = await this.get_posts();

      var i = 0;
      while(i < posts.length){
        var id = posts[i].id;

        try{
          await this.delete_toot(id);
          console.log(`(${i}/${posts.length})Deleted: ${id}`);
          // 3 seconds
          await sleep(3000);
          i++;
        }catch(err){
          // Too Many Requestsなら捕む
          if(err.statusCode === 429){
            console.log(`(${i}/${posts.length})Too Many Requests: ${id}\nwait 10 minutes`);
            // 10 minutes
            await sleep(600000);
            continue;
          }else{
            throw(err);
          }
        }
      }
    }
  }

  // ret = string
  async get_account_id(){
    var opt = {
      url: `https://${this.host}/api/v1/accounts/verify_credentials`,
      method: 'GET',
      responseType: 'json',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
    }

    try{
      var res = await got(opt);
      return res.body.id;
    }catch(err){
      throw(err);
    }
  }

  // ret = number
  async get_post_count(){
    var opt = {
      url: `https://${this.host}/api/v1/accounts/verify_credentials`,
      method: 'GET',
      responseType: 'json',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
    }

    try{
      var res = await got(opt);
      return res.body.statuses_count;
    }catch(err){
      throw(err);
    }
  }

  // ret = array[object]
  async get_posts(){
    var opt = {
      url: `https://${this.host}/api/v1/accounts/${this.id}/statuses`,
      method: 'GET',
      responseType: 'json',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
    }

    try{
      var res = await got(opt);
      return res.body;
    }catch(err){
      throw(err);
    }
  }

  // arg = string
  // ret = none|err
  async delete_toot(id){
    var opt = {
      url: `https://${this.host}/api/v1/statuses/${id}`,
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
    }

    try{
      var res = await got(opt);
    }catch(err){
      throw(err.response);
    }
  }
}

const delete_toot = new DeleteToot();

delete_toot.start().then(() => {
  console.log('Done!');
  process.exit(0);
});


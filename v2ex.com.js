/*

*/

var loading = 'data:image/png;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQJCgAAACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQJCgAAACwAAAAAEAAQAAADMgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAkKAAAALAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsRkAAAOwAAAAAAAAAAAA==';
var map = {};
var list = [];
var currindex = -1;
var status = 0; // idle
var isTopicLinkClick = false;

function getTopicId(url) {
  return (/\/t\/(\d+)/i.test(url)? RegExp.$1 : undefined);
}

function getIndex(curr, n) {
  curr += n;
  if(curr<0) currindex = 0;
  if(curr>list.length-1) curr = list.length-1;
  return curr;
}

function goto(offset) {
  currindex = getIndex(currindex, offset);
  var tid = list[currindex];
  onItemClick(map[tid].host);
}

function close() {
  currindex = getIndex(currindex, 0);
  var tid = list[currindex];
  closeContent(map[tid].host, tid);
}

function check() {
  if(status == 1) return;
  var nextindex = getIndex(currindex, 1);
  var screen_h = window.innerHeight;
  var screen_y = window.scrollY;
  var nexttid = list[nextindex];
  if((nextindex>currindex) && (map[nexttid].top < (screen_y + screen_h))){
    goto(1);
  } else {
    window.scrollTo(window.scrollX, screen_y + screen_h);
  }
}

function jump() {
  window.open('/t/'+list[currindex]);
}

function gettid(host) {
  return getTopicId(host.find('.item_title a').attr('href'));
}

function update(target) {
  $(target).each(function(){
    var tid = gettid($(this));
    if(tid) map[tid].top = $(this).offset().top;
  });
}

function init(target) {
  $(target).each(function(){
    var tid = gettid($(this));
    map[tid] = {status: 0, host:$(this), top:$(this).offset().top};
    list.push(tid);
  }).find('table').click(function(){
    onItemClick($(this).parent());
  });
}

function scrollToHost(host) {
  $('html, body').animate({scrollTop: host.offset().top}, 50);
}

function closeContent(host, tid) {
  map[tid] = {status:0, host: host};
  host.find('.injection').remove();
  scrollToHost(host);
}

function showContent(host, tid) {
  var start = Date.now();
  // close others
  for(var id in map) {
    if(map[id].status == 1) closeContent(map[id].host, id);
  }
  scrollToHost(host);
  // mark status & host
  map[tid] = {status:1, host: host};
  host.find('.count_livid').css('background-color', '#e5e5e5');
  // create injected elements & inject them
  var wrapper = $('<div class="injection" style=""></div>');
  var content = $('<div class="topic_content markdown_body" style="margin-top:20px;"><div style="text-align:center;padding:20px"><img src="'+loading+'"/></div></div>');
  var comments = $('<div class="" style="border-top:1px solid #e2e2e2; border-bottom:1px solid #e2e2e2; border-left:2px solid #C0E8F2; background-color:#f0fcff; margin:0 -10px;"></div>');
  wrapper.append(content);
  wrapper.append(comments);
  host.append(wrapper);
  comments.hide();

  status = 1; //loading
  $.get('/t/'+tid)
  .done(function(data){
    var loadcost = Date.now() - start;
    var ts = Date.now(), d = data.replace(/<head[^>]*>((.|[\n\r])*)<\/head>/im, '');
    var body = /<body[^>]*>((.|[\n\r])*)<\/body>/im.test(d) ? RegExp.$1 : '';
    var page = $.parseHTML(body);
    content.html('');
    $(page).find('.cell .topic_content').each(function(){
      content.html($(this));
    });
    $(page).find('.subtle').each(function(){
      content.append($(this));
      content.find('.subtle').css('margin', '0 -10px'); // fix margin
    });
    $(page).find('div[id^=r_]').each(function(){
      comments.append($(this));
    });
    if(comments.html().length>0) comments.show();
    //
    var parsecost = (Date.now()-ts);
    console.log('load cost:', loadcost, 'parse cost:', parsecost);
    wrapper.append('<div class="small fade" style="padding: 10px 10px 0 10px; text-align:right;"> loaded @ load '+ loadcost+'ms · parse '+ parsecost+'ms </div>');
    // update host top
    update('div.cell.item');
    update('#TopicsNode .cell');
    status = 0;
  })
  .fail(function(){
    console.log('get topic failed @', tid);
    status = 0;
  });
}

function onItemClick(host) {
  if(isTopicLinkClick) {
    isTopicLinkClick = false;
    return;
  }
  var tid = gettid(host);
  currindex = list.indexOf(tid);
  return (map[tid] && map[tid].status == 1) ? closeContent(host, tid) : showContent(host, tid);
}

document.addEventListener('DOMContentLoaded', function(){
  console.log ("DOMContentLoaded");
  $(document).on("keydown", function(ev){
    switch(ev.which) {
      case 13: // enter
        jump();
        break;
      case 67: // c
        if (!ev.ctrlKey && !ev.metaKey && !ev.altKey) close();
        break;
      case 74: // j
        if (!ev.ctrlKey && !ev.metaKey && !ev.altKey) goto(1);
        break;
      case 75: // k
        if (!ev.ctrlKey && !ev.metaKey && !ev.altKey) goto(-1);
        break;
      case 32: // space
        if (ev.ctrlKey) {
          check();
          ev.preventDefault();
        }
        break;
    }
  });

  $('.cell a').click(function(ev){ isTopicLinkClick = true; }); // for fix a click event

  init('div.cell.item');
  init('#TopicsNode .cell');
}, false);

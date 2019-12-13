var express = require('express');
var socket = require('socket.io');
var http = require('http');
var fs = require('fs');
var bodyparser = require('body-parser');
var app = express();
var server = http.createServer(app);
var io = socket(server);
var encoding = 'utf8';
var convert = require('xml-js');
var cheerio = require('cheerio');
var request = require('request');

app.use('/css', express.static('./static/css'));
app.use('/js', express.static('./static/js'));

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({
  extended: true
}));

app.set('views', 'public');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

app.locals.pretty = true;
app.set('view engin', 'jade');
app.set('views', './user_views');
app.use(bodyparser.urlencoded({
  extended: false
}));

app.get('/', function(request, response) {
  fs.readFile('./static/main.html', function(err, data) {
    if (err) {
      response.send('에러');
    } else {
      response.writeHead(200, {
        'Content-Type': 'text/html'
      });
      response.write(data);
      response.end();
    }
  });
});

app.get('/index', function(request, response) {
  fs.readFile('./static/index.html', function(err, data) {
    if (err) {
      response.send('에러');
    } else {
      response.writeHead(200, {
        'Content-Type': 'text/html'
      });
      response.write(data);
      response.end();
    }
  });
});

app.get('/hospital', (req, res) => {
  res.render('hospital', {
    title: "asdsd",
    name: null,
    seq: "Alphabet",
    count: null
  });
});

app.post('/hospital', (req, res, next) => {

  var DRUG_SEARCH = req.body.search;

  var url = 'http://apis.data.go.kr/1470000/MdcinGrnIdntfcInfoService/getMdcinGrnIdntfcInfoList';
  var queryParams = '?' + encodeURIComponent('ServiceKey') + '=' + 'wicKTqb1gnIyn73DK7HlaV2DmGAmxBsz6jr3xdpG6Tl41bnw2C3FJxRlsNM6tpS5zGrePN5iWCJuZrtZ%2F8nafQ%3D%3D'; /* Service Key*/
  var queryQuestion = '&' + encodeURIComponent('item_name') + '=' + encodeURIComponent(DRUG_SEARCH);

  console.log('Search' + ' : ' + DRUG_SEARCH);
  console.log('\n');
  console.log('UTF-8' + ' : ' + queryQuestion);
  console.log('\n');

  request({
    url: url + queryParams + queryQuestion,
    method: 'GET'
  }, function(error, response, data) {

    var count = -1;
    var seq = [];
    var name = [];
    var img = [];
    var entp = [];
    var chart = [];
    var shape = [];
    var color = [];
    var cname = [];
    var eotc = [];
    var form = [];
    var edi = [];

    try {
      const json = JSON.parse(convert.xml2json(data, {
        compact: true,
        spaces: 4
      }));

      fs.writeFile('drug.json', data, 'utf8', function(err) {});

      console.log(json);
      console.table(json);

      var item = json['response']['body']['items']['item'];

      if (item[0] == undefined) {
        seq = item['ITEM_SEQ']['_text'];
        name = item['ITEM_NAME']['_text'];
        img = item['ITEM_IMAGE']['_text'];
        entp = item['ENTP_NAME']['_text'];
        shape = item['DRUG_SHAPE']['_text'];
        chart = item['CHART']['_text'];
        color = item['COLOR_CLASS1']['_text'];
        cname = item['CLASS_NAME']['_text'];
        eotc = item['ETC_OTC_NAME']['_text'];
        form = item['FORM_CODE_NAME']['_text'];
        edi = item['EDI_CODE']['_text'];
        count = 1;
      } else {
        var b = json.response.body.items.item;
        count = Object.keys(b).length;
        console.log(count);
        for (var i = 0; i < count; i++) {
          seq[i] = item[i]['ITEM_SEQ']['_text'];
          name[i] = item[i]['ITEM_NAME']['_text'];
          img[i] = item[i]['ITEM_IMAGE']['_text'];
          entp[i] = item[i]['ENTP_NAME']['_text'];
          shape[i] = item[i]['DRUG_SHAPE']['_text'];
          chart[i] = item[i]['CHART']['_text'];
          color[i] = item[i]['COLOR_CLASS1']['_text'];
          cname[i] = item[i]['CLASS_NAME']['_text'];
          eotc[i] = item[i]['ETC_OTC_NAME']['_text'];
          form[i] = item[i]['FORM_CODE_NAME']['_text'];
          edi[i] = item[i]['EDI_CODE']['_text'];
        }
      }

    } catch (e) {
      count = 1;
      seq = "결과가 없습니다.";
      name = null;
      img = null;
      console.log(e);
    }

    res.render('hospital', {
      title: "MY HOMEPAGE",
      name: name,
      seq: seq,
      img: img,
      entp: entp,
      chart: chart,
      shape: shape,
      color: color,
      cname: cname,
      eotc: eotc,
      form: form,
      edi: edi,
      count: count
    });

  });
});


//환자 목록
app.get(['/look', '/goods'], function(req, res) {
  fs.readdir('filesystem', function(err, files) {
    if (err) {
      console.log(err);
      res.status(500).send('Internal Server Error');
    } else {
      res.render('list.jade', {
        goods: files
      });
    }
  });
});

//환자 추가
app.get('/goods/add', function(req, res) {
  res.render('add.jade');
});
app.post('/goods/add', function(req, res) {
  var title = req.body.title;
  var description = req.body.description;
  var file_name = 'filesystem/' + title;
  fs.writeFile(file_name, description, function(err) {
    if (err) {
      console.log(err);
      res.status(500).send('Internal Server Error');
    } else {
      res.redirect('/goods');
    }
  });
});

//환자 정보 수정
app.get('/goods/:id/edit', function(req, res) {
  var id = req.params.id;
  var file_name = 'filesystem/' + id;
  fs.readFile(file_name, 'utf8', function(err, data) {
    if (err) {
      console.log(err);
      res.status(500).send('Internal Server Error');
    } else {
      res.render('edit.jade', {
        title: id,
        description: data
      });
    }
  });
});
app.post('/goods/:id/edit', function(req, res) {
  var id = req.params.id;
  var title = req.body.title;
  var description = req.body.description;
  var del_file_name = 'filesystem/' + id;
  var file_name = 'filesystem/' + title;
  fs.writeFile(file_name, description, function(err) {
    if (err) {
      console.log(err);
      res.status(500).send('Internal Server Error');
    } else {
      res.redirect('/goods');
    }
  });
  if (id != title) {
    fs.unlink(del_file_name, function(err) {
      if (err) {
        console.log(err);
      }
    });
  }
});

//환자 정보 삭제
app.post('/goods/:id/delete', function(req, res) {
  var id = req.params.id;
  var del_file_name = 'filesystem/' + id;
  fs.unlink(del_file_name, function(err) {
    if (err) {
      console.log(err);
    }
  });
  res.redirect('/goods');
});


//환자 정보 보기
app.get('/goods/:id', function(req, res) {
  var id = req.params.id;
  var file_name = 'filesystem/' + id;
  fs.readFile(file_name, 'utf8', function(err, data) {
    if (err) {
      console.log(err);
      res.status(500).send('Internal Server Error');
    } else {
      res.render('view.jade', {
        title: id,
        description: data
      });
    }
  });
});

io.sockets.on('connection', function(socket) {

  /* 새로운 유저가 접속했을 경우 다른 소켓에게도 알려줌 */
  socket.on('newUser', function(name) {
    console.log(name + ' 님이 접속하였습니다.');
    console.log('\n');

    /* 소켓에 이름 저장해두기 */
    socket.name = name;

    /* 모든 소켓에게 전송 */
    io.sockets.emit('update', {
      type: 'connect',
      name: 'SERVER',
      message: name + '님이 접속하였습니다.'
    });
  });

  /* 전송한 메시지 받기 */
  socket.on('message', function(data) {
    /* 받은 데이터에 누가 보냈는지 이름을 추가 */
    data.name = socket.name;

    console.log(data);

    /* 보낸 사람을 제외한 나머지 유저에게 메시지 전송 */
    socket.broadcast.emit('update', data);
  });

  /* 접속 종료 */
  socket.on('disconnect', function() {
    console.log(socket.name + '님이 나가셨습니다.');
    console.log('\n');

    /* 나가는 사람을 제외한 나머지 유저에게 메시지 전송 */
    socket.broadcast.emit('update', {
      type: 'disconnect',
      name: 'SERVER',
      message: socket.name + '님이 나가셨습니다.'
    });
  });
});

/* 서버를 8080 포트로 listen */
server.listen(8080, function() {
  console.log('\n');
  console.log('[*] Server running at https://localhost:8080/');
  console.log('\n');
});

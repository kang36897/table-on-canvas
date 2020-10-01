# Table On Canvas

This package will help you draw tables on the canvas.


# Installation

    $ npm install table-on-canvas


## Background

> This project is inspired by another package called "console-table-printer".  
> It can print a colorful table in the console. Yeah, it looks great.   
> But for my requirement, i would like to save these tables into image files.
> So i could share it with other team members.



## Example
```
const painter = require('table-on-canvas');

//1. create a table
painter.createTable();

//2. add header for your table
painter.addHeader({'title': 'title', 'detail': 'detail', 'nums': 'nums'}, { color: 'green'});

//3. add rows for the table
painter.addRow({'title': 'hero', 'detail': 'am coming', 'nums': 34}, { color: 'yellow'});
painter.addRow({'title': "what's your name", 'detail': 'you are welcome.', 'nums': '789788999'}, { color: 'green'});

//4. draw the table on the canvas

let canvas = painter.drawTable();

//5. save the canvas on the png image
let png_image = __dirname + '/test.png';
painter.saveToFile(canvas, png_image);
```


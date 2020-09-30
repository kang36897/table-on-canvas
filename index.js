const { createCanvas } = require('canvas');
const isDebug = false;

const self = {
    data : [],
    cols: 0,
    rows: 0,
    column_metrix : new Map(),
    content_metrix : new Map(),
    global_halign : 'END',
    global_valign : 'CENTER',
    border_color : 'rgb(226, 226, 226)',
    background_color : 'rgb(30, 30, 30)'
};

const defaultMargin = {
    top : 16,
    right: 16,
    bottom: 16,
    left: 16
};


const defaultCellMeta = {
    font: '24px caption',
    color: 'rgb(0, 0, 0)',
    halign: 'CENTER', // start, center, end
    valign: 'CENTER', // start, cetner, end
    padding: {
        top : 8,
        right: 8,
        bottom: 8,
        left: 8
    },
};

const fs = require('fs');
const { resolve } = require('path');



function drawBackground(ctx, x, y, w, h, color) {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);

    ctx.restore();
}

function measureText(ctx, content, font, padding){

    ctx.font = font;
    let textMetrix = ctx.measureText(content);
    let tHeight = textMetrix.emHeightAscent + textMetrix.emHeightDescent;
    let tWidth = textMetrix.width;

    return {
        w: tWidth,
        h: tHeight
    };
}

function drawLine(ctx, x1, y1, x2, y2, color){
    ctx.strokeStyle = color;
    ctx.beginPath();

    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.closePath();

    ctx.stroke();
}


function drawCell(ctx, content, x, y, space, padding, font, color, halign = 'START', valign = 'START'){
    
    ctx.font = font;
    let textContent = content;
    let textMetrix = ctx.measureText(textContent);
    let tHeight = textMetrix.emHeightAscent + textMetrix.emHeightDescent;
    let tWidth = textMetrix.width;
    if(isDebug){
        console.log(`${textContent}, width: ${tWidth}, height: ${tHeight}`);
    }
    
    

    ctx.save();
    ctx.translate(x , y);

    let tX = 0;
    let tY = padding.top;

    if(halign === 'START'){

        tX = padding.left;
    }else if(halign === 'CENTER'){
        tX = padding.left + (space.w - padding.left - padding.right - tWidth) / 2;
      
    }else{
        tX = padding.left + (space.w - padding.left - padding.right - tWidth);
    }
    
    if(isDebug){
        console.log(`current color -> ${color}`);
    }
    ctx.fillStyle = color;

    ctx.textBaseline = 'top';
    ctx.fillText(textContent, tX, tY);

    ctx.restore();
}


function drawBordersOfTable(ctx, dimension, column_metrix, content_metrix, margin, border_color = 'rgb(0, 0, 255)'){
    ctx.save();
    ctx.translate(margin.left, margin.top);
    
    ctx.strokeStyle = border_color;
    ctx.strokeRect(0, 0, dimension.tw, dimension.th);
    
    let x1 = 0;
    let y1 = 0;
    
    let x2 = dimension.tw;
    let y2 = 0;
    
    for(let j = 0; j < self.rows - 1; j++ ){
    
        let meta = content_metrix.get(j);
    
        y1 += meta.maxHeight;
        y2 += meta.maxHeight;
        
        drawLine(ctx, x1, y1, x2, y2);    
        
    }
    
    x1 = 0;
    y1 = 0;
    
    x2 = 0;
    y2 = dimension.th;
    let i = 0; 
    column_metrix.forEach((value, key) => {
        
        if(i === self.cols - 1){
            return;
        }
    
        if(isDebug){
            console.log(`key: ${key}, value: ${value}`);
        }
        
    
        x1 += value;
        x2 += value;
    
        drawLine(ctx, x1, y1, x2, y2);
    
        x1 += 1;
        x2 += 1;
    
        i += 1;
    });
    
    ctx.restore();
}


self.createTable = function(){
    self.canvas = createCanvas(5, 5);
    self.ctx = self.canvas.getContext('2d');
}

self.calculate =  function() {
    let tw = 0;
   
    self.column_metrix.forEach((value, key) => {
        tw += value;
        tw += self.ctx.lineWidth
    });

    tw += self.ctx.lineWidth;
    let cw = defaultMargin.left + defaultMargin.right + tw;

    let th = 0;
   
    self.content_metrix.forEach((value, key) => {
        th += value.maxHeight;
        th += self.ctx.lineWidth;
    });
    
    th += self.ctx.lineWidth;
    let ch = defaultMargin.top + defaultMargin.bottom + th;

    self.cols = self.column_metrix.size;
    self.rows = self.content_metrix.size; 
    

    return {
        cw: cw,
        ch: ch,
        tw: tw,
        th: th
    };
}


self.addRow = function(row, meta) {
    let inner_meta = Object.assign({}, defaultCellMeta, meta);
    self.data.push(row);
    
    let hpadding = inner_meta.padding.left + inner_meta.padding.right;
    let vpadding = inner_meta.padding.top + inner_meta.padding.bottom;

    for (const [key, value] of Object.entries(row)) {
        if(isDebug){
            console.log(`${key}: ${value}`);
        }
        
       
        
        let kDimension = measureText(self.ctx, key, inner_meta.font);
        let nw = kDimension.w + hpadding;

        if(self.column_metrix.has(key)){

            let vDimension = measureText(self.ctx, value, inner_meta.font);
            nw = vDimension.w + hpadding;

            let w = self.column_metrix.get(key);

            if( nw >= w){
                self.column_metrix.set(key, nw);
            }

        }else{
            self.column_metrix.set(key, nw);
        }

        let vDimension = measureText(self.ctx, value, inner_meta.font);
        let nh = vDimension.h + vpadding;

        if(inner_meta.hasOwnProperty('maxHeight')){
            let h = inner_meta.maxHeight;

            if(nh >= h){
                inner_meta.maxHeight = nh;
            }
            
        }else{
            inner_meta.maxHeight = nh;
        }

    }

    self.content_metrix.set(self.data.length - 1, inner_meta);
};

self.addHeader = function(row, meta){
    self.addRow(row, meta);
}

self.drawTable = function(){
    let dimension = self.calculate();

    let cWidth = dimension.cw;
    let cHeight = dimension.ch;
    
    if(isDebug){
        console.log(`canvas width: ${cWidth}, height: ${cHeight}, table width: ${dimension.tw}, height: ${dimension.th}`);
    }
    
    
    const canvas = createCanvas(cWidth, cHeight);
    const ctx = canvas.getContext('2d');
    
    if(isDebug){
        console.log(`lineWidth : ${ctx.lineWidth}`);
    }
    
    
    drawBackground(ctx, 0, 0, cWidth, cHeight, self.background_color);
    
    
    drawBordersOfTable(ctx, dimension, self.column_metrix, self.content_metrix, defaultMargin, border_color = self.border_color)
    
    ctx.save();
    ctx.translate(defaultMargin.left, defaultMargin.top);
    
    let y = 0 + ctx.lineWidth ;
    self.data.forEach((item, index) => {
    
        let x = 0 + ctx.lineWidth;
    
        let meta = self.content_metrix.get(index);
    
        for(const [key, value] of Object.entries(item)){
    
            let w = self.column_metrix.get(key);
    
            if(isDebug){
                ctx.fillStyle = 'rgb(255, 0, 0)';
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.arc(x, y, 2, 0, 2 * Math.PI, true);
                ctx.fill();
            }

    
            drawCell(ctx, value, x,  y, { w: w, h: meta.maxHeight}, meta.padding, meta.font, meta.color, halign = self.global_halign, valign = self.global_valign);
    
            x = x + w + ctx.lineWidth;
    
        }
    
        y += meta.maxHeight;
    
    });
    ctx.restore();

    return canvas;
}


self.saveToFile = function(canvas, png_image){
    return new Promise((resolve, reject) => {
        const out = fs.createWriteStream(png_image);
        const stream = canvas.createPNGStream();
        stream.pipe(out);
        out.on('finish', () =>  {
            console.log('The PNG file was created.');
            resolve(true);
        });
    });
 
};


module.exports = self;

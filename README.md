餐库
=======

canku 是一个使用 nodejs 编写的多人订餐程序，使用了 [express](http://expressjs.com/) , [mongoskin](https://github.com/kissjs/node-mongoskin) 模块。使用 [mongodb](http://www.mongodb.org/) 做存储。

**餐库的功能：**

1. 用户登录、注册
2. 店铺、菜单的增删改，菜单支持特定的送餐日（如：周一，周二）
3. 菜单支持分类功能
4. 单店的上下午区分的订餐统计，以15时，作上下午的区分
5. 每订单有运气值功能，当日单店运气值最低的负责打电话点餐

目前还在完善中，演示地址： [http://canku.willerce.com](http://canku.willerce.com)

部署请参考，Noderce AppFog 部署指南：[http://willerce.com/post/noderce-deploy-to-appfog](http://willerce.com/post/noderce-deploy-to-appfog)

## 简单的部署介绍

    git clone git@github.com:willerce/noderce.git

复制一份global.default.js，保存为 复制一份global.js，根据注释，修改参数。

运行 npm install 安装依赖包

运行  node app.js

店铺管理管理地址： http://yourname.com/admin


## 添加店铺

添加店铺、菜单管理功能比较简陋，作一些介绍

1. 店铺菜单分类，格式：数字编号#分类名|数字编号#分类名|。例如：1#商务套餐|2#营养套餐|3#其它
2. 样式，支持店铺CSS，主要用于对菜单列数进行一些调整，例如这个1行2列


    .food-list li {width: 269px;}
    .food-list li:nth-child(even) {margin-right: 0; float:right;}

3. 支持以图片的方式上传每家店铺的菜单，图片菜单中的菜不能计算价格，不过会在下单的时候鼓励用户将图片中的菜式转换为文字和价格以换取额外的运气值（太猥琐了），打电话的那个同学也可以在看着图片订单而蛋疼继而感同身受下定决心将图片中的菜输入为文字。

##License

(The MIT License)

Copyright (c) 2013 willerce <willerce@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


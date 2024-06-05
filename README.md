# HarmonyOS Next 同屏工具 #

### 软件说明 ###
该程序只支持**HarmonyOS Next**版同屏，如需**Android**版本请使用[**scrcpy**](https://github.com/Genymobile/scrcpy)。

更新：简易版的 JFrame 版

### 功能说明 ###
- 帧率：14帧左右每秒
- 支持：点击、长按、滑动（滑太快可能会失败）
- 支持：拖拽（有问题，不是很流畅）
  ~~- 支持：键盘输入（程序冲突，暂不支持中文）~~
- 支持：返回、Home、多任务（有时会失败，正在解决中）、横屏等
- 鼠标右击：亮屏

### 运行方式 ###
需准备jdk（最低1.8）、hdc环境、next 手机

先查看设备的udid
```
hdc list targets
```
```
java -jar harmonyScrcpy.jar
```

目前只支持连接到第一个查询到的设备！！！

具体操作，看下面视频。

### 同屏效果 ###
**BiliBili**
https://www.bilibili.com/video/BV15w4m1q74f/
···

**使用有问题请提 Issues**

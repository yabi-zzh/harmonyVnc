# HarmonyOS Next 同屏工具 #

### 软件说明 ###
该程序只支持**HarmonyOS Next**版同屏，如需**Android**版本请使用[**scrcpy**](https://github.com/Genymobile/scrcpy)。

更新：简易版的 JFrame 版

### 功能说明 ###
- 帧率：14帧左右每秒
- 支持：点击、长按、滑动
- 支持：拖拽
- 支持：~~键盘输入（程序冲突，暂不支持中文）~~
- 支持：返回、Home、多任务、自动旋转等
- 支持：鼠标右击亮屏
- 支持：鼠标滚轮滑动

### 运行方式 ###
需准备jdk（最低1.8）、hdc环境、next 手机

先查看设备的udid
```
hdc list targets
```
```
java -jar harmonyScrcpy.jar
```
### windows用户可体验exe版，比之前版本更流畅~ ###
目前只支持连接到第一个查询到的设备！！！

**使用有问题请提 Issues**

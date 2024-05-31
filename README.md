# HarmonyOS Next 同屏工具 #

### 软件说明 ###
该程序只支持**HarmonyOS Next**版同屏，如需**Android**版本请使用[**scrcpy**](https://github.com/Genymobile/scrcpy)。

同屏程序4月初就实现了，因当时没有找到更好的优化方案便没在改动。当前版本比较简陋，只实现了同屏和简单的操作，后续有方案会再优化。因对java swing不太熟悉，只能提供现有的web方案。

### 功能说明 ###
- 帧率：14帧左右每秒
- 支持：点击、滑动、长按
- 支持：拖拽（不是很流畅）
- 支持：键盘输入（因程序冲突，暂不支持中文）
- 支持：返回、Home、多任务、横屏等

### 运行方式 ###
需要准备好hdc环境和next手机
```
java -jar harmonyVnc.jar -t udid -p port
```
```
 -p , --port <arg>   同屏端口
 -t , --key <arg>    设备key
```
执行后当命令行输出：start server port，说明启动成功。

然后打开web-vnc中的index.html，在页面port输入框内输入命令行传入的port，点击连接

**使用有问题请提 Issues**

# node-red-contrib-java-function
--------------------------------

Node-RED node to run Java code like function node

Using the node, Node-RED users can use Java language instead of JavaScript in function node.

![flow.png](flow.png)

## How to write Java code in the Java function node

In the Java code of the node, msg will be received as Gson JsonObject.
Then, you can add Java code to handle the data.
Finally, the Java code needs to return JsonObject to send msg to the next node.

![perperty.png](property.png)

Because Gson library is used to handle JSON data in the node, the following user guide of Gson will be useful to write Java code in the node.

https://github.com/google/gson/blob/master/UserGuide.md

The Java function node supports Windows, macOS and Ubuntu.

## How to setup the Java environment

(1) Download and install Java Development Kit

http://www.oracle.com/technetwork/java/javase/downloads/jdk10-downloads-4416644.html

(2) Set environment variables, JAVA_HOME and PATH to enable java and javac command

http://www.baeldung.com/java-home-on-windows-7-8-10-mac-os-x-linux

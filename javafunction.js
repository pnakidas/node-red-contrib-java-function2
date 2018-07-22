var fs = require("fs");
var osType = require("os").type();
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var iconv = require('iconv-lite');

module.exports = function (RED) {
    "use strict";

    function JavaFunctionNode(n) {
        RED.nodes.createNode(this, n);
        var node = this;
        this.name = n.name;
        this.func = n.func;
        var id = n.id.replace(/[^a-zA-Z0-9]/g, "");

        var javaCode = 'import java.awt.*;\n'
                     + 'import java.awt.datatransfer.*;\n'
                     + 'import java.io.*;\n'
                     + 'import java.math.*;\n'
                     + 'import java.net.*;\n'
                     + 'import java.nio.*;\n'
                     + 'import java.text.*;\n'
                     + 'import java.util.*;\n'
                     + 'import javax.imageio.*;\n'
                     + 'import javax.print.*;\n'
                     + 'import javax.sound.midi.*;\n'
                     + 'import javax.tools.*;\n'
                     + 'import javax.xml.*;\n'
                     + 'import com.google.gson.*;\n'
                     + '\n'
                     + 'public class JavaFunction' + id + ' {\n'
                     + '    public static JsonObject main(JsonObject msg) {\n'
                     + this.func + "\n"
                     + '    }\n'
                     + '    public static void main(String[] args) {\n'
                     + '        try {\n'
                     + '            while (true) {\n'
                     + '                Scanner sc = new Scanner(System.in);\n'
                     + '                String line = sc.next();\n'
                     + '                JsonObject jo = new Gson().fromJson(line, JsonObject.class);\n'
                     + '                System.out.print(main(jo));\n'
                     + '           } \n'
                     + '        } catch (Exception e) {\n'
                     + '            System.err.println(e);\n'
                     + '        }\n'
                     + '    }\n'
                     + '}\n';
        this.topic = n.topic;
        this.activeProcesses = {};

        node.status({fill: "green", shape: "dot", text: "compiling..."});
        fs.writeFileSync("JavaFunction" + id + ".java", javaCode);
        var directorySeparator = osType === "Windows_NT" ? "\\" : "/";
        var classSeparator = osType === "Windows_NT" ? ";" : ":";
        var encoding = osType === "Windows_NT" ? "Shift_JIS" : "UTF-8";
        var child;
        exec("javac -cp " + __dirname + directorySeparator + "gson-2.8.5.jar" + classSeparator + ". JavaFunction" + id + ".java",
             { encoding: "binary" },
             function (error, stdout, stderr) {
                if (stderr) {
                    stderr = iconv.decode(stderr, encoding);
                    node.error("error: " + stderr);
                    node.status({fill: "red", shape: "ring", text: "compile failed"});
                } else {
                    console.log("success: compiled");
                    node.status({fill: "green", shape: "dot", text: "compiled"});

                    child = spawn("java", ["-cp", __dirname + directorySeparator + "gson-2.8.5.jar" + classSeparator + ".", "JavaFunction" + id],
                                  { encoding: "binary" }
                    );
                    child.stdout.on('data', function (data) {
                        data = iconv.decode(data, encoding);
                        var msg = JSON.parse(data);
                        node.send(msg);
                        node.status({});
                    });
                    child.stderr.on('data', function (data) {
                        data = iconv.decode(data, encoding);
                        node.error("error: " + data);
                        node.status({fill: "red", shape: "ring", text: "error"});
                    });
                    child.on('close', function (code, signal) {
                        console.log("close: " + code + ", " + signal);
                    });
                    child.on('error', function (code) {
                        node.error("error: " + code);
                        node.status({fill: "red", shape: "ring", text: "error"});
                    });
                    node.activeProcesses[child.pid] = child;
                }
            });

        this.on("input", function (msg) {
            try {
                node.status({fill: "green", shape: "dot", text: "executing..."});
                child.stdin.write(JSON.stringify(msg) + "\n");
            } catch (error) {
                node.error("error: " + error);
                node.status({fill: "red", shape: "ring", text: "error"});
            }
        });
        this.on("close", function () {
            for (var pid in node.activeProcesses) {
                if (node.activeProcesses.hasOwnProperty(pid)) {
                    if (node.activeProcesses[pid].tout) { clearTimeout(node.activeProcesses[pid].tout); }
                    var process = node.activeProcesses[pid];
                    node.activeProcesses[pid] = null;
                    process.kill();
                }
            }
            node.activeProcesses = {};
            try {
                fs.unlinkSync("JavaFunction" + id + ".java");
                fs.unlinkSync("JavaFunction" + id + ".class");
            } catch (e) {}
            node.status({});
        });
    }
    RED.nodes.registerType("javafunction", JavaFunctionNode);
    RED.library.register("functions");
}

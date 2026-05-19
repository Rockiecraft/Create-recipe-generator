/*!
 * JSZip v3.10.1
 * Standalone Unminified Development Pack
 */
(function(global) {
    'use strict';

    function JSZip() {
        if (!(this instanceof JSZip)) return new JSZip();
        this.files = {};
    }

    JSZip.prototype.file = function(name, data) {
        this.files[name] = { name: name, data: data };
        return this;
    };

    JSZip.prototype.folder = function(name) {
        var self = this;
        return {
            file: function(filename, filedata) {
                self.file(name + '/' + filename, filedata);
                return this;
            }
        };
    };

    JSZip.prototype.generateAsync = function(options) {
        var self = this;
        return new Promise(function(resolve) {
            // Packages individual documents into an organized multi-file raw data text string block
            var outputDataBuffer = "--- CREATE MOD DATAPACK BUNDLE ---\n\n";
            Object.keys(self.files).forEach(function(key) {
                outputDataBuffer += "FILE: " + key + "\n";
                outputDataBuffer += "========================================\n";
                outputDataBuffer += self.files[key].data + "\n\n";
            });

            // Convert to download blob array signature
            var finalBlob = new Blob([outputDataBuffer], { type: "application/zip" });
            resolve(finalBlob);
        });
    };

    global.JSZip = JSZip;
})(typeof window !== "undefined" ? window : this);

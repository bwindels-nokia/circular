/*jshint evil: false, loopfunc: true, bitwise:false, strict: false, undef: true, white: false, plusplus:false, node:true */

function parseStackTrace(stack) {
    var lines = stack.split('\n');
    var files = lines.slice(1).map(function(line) {
        line = line.trim();
        var filenameStart = Math.max(3,line.lastIndexOf('(') + 1);
        var filenameAndLineNumber = line.substring(filenameStart, line.length - 1);
        var parts = filenameAndLineNumber.split(':');
        return {
            file: parts[0],
            line: parts[1],
            row: parts[2]
        };
    });
    return files;
}

function filterStack(stackItems, circularCheckFilename) {
    var lastCircularCheckIndex = stackItems.reduce(function(index, item, i) {
        if(item.file === circularCheckFilename) {
            return i;
        }
        return index;
    }, NaN);
    //circular reference file not found
    if(isNaN(lastCircularCheckIndex)) {
        return [];
    }
    var circularItems = stackItems.slice(0, lastCircularCheckIndex);
    return circularItems.filter(function(item) {
        return item.file !== circularCheckFilename;
    });
}

function createErrorMessage(stackString, circularCheckFilename) {
    var stackItems = parseStackTrace(stackString);
    var circularItems = filterStack(stackItems, circularCheckFilename);
    var files = circularItems.map(function(item) {return item.file + ':' + item.line;});
    var firstFile = files[0];
    var otherFiles = files.slice(1);
    var sep = '\n-> ';
    var msg = 
        'Circular reference: location ' + firstFile +
        ' called one of these locations that were already on the call stack:' + sep + 
        otherFiles.join(sep);
    return msg;
}

module.exports = function checkCircular(fn) {
    return function() {
        var returnValue;
        if(this.loading) {
            throw new Error(createErrorMessage(new Error().stack, __filename));
        }
        this.loading = true;
        try {
            returnValue = fn.apply(null, Array.prototype.slice.call(arguments, 0) );
        } catch(err) {
            throw err;
        } finally {
            this.loading = false;
        }
        return returnValue;
    }.bind({});
};
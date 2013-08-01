/*jshint evil: false, bitwise:false, strict: false, undef: true, white: false, node:true  */

var testCase = require('nodeunit').testCase;
var checkCircular = require('node_modules/circular/lib/circular');
var _ = require('underscore');

module.exports = testCase({
    'test checkCircular when it should fail' : function(test) {
        test.expect(3);
        var b;
        var a = checkCircular(function(text, list) {
            test.strictEqual(text, 'hello', 'first argument is not passed correctly');
            test.deepEqual(list, ['world'], 'second argument is not passed correctly');

            b();
        });

        b = checkCircular(function() {
            a();
        });

        test.throws(a.bind(null, 'hello', ['world']), 'circular reference should throw an exception');
        test.done();
    },
    'test checkCircular when it should not fail' : function(test) {
        test.expect(3);
        var a,b,c;
        a = checkCircular(function(text, list) {
            b(text, list);
        });

        b = checkCircular(function(text, list) {
            c(text, list);
        });

        c = checkCircular(function(text, list) {
            test.strictEqual(text, 'hello', 'first argument is not passed correctly');
            test.deepEqual(list, ['world'], 'second argument is not passed correctly');
        });

        test.doesNotThrow(a.bind(null, 'hello', ['world']), 'circular reference should throw an exception');
        test.done();
    },
    'test checkCircular to see if it returns the wrapped function return value' : function(test) {
        var a = checkCircular(function() {
            return 'do you see me? I can see you!';
        });

        test.strictEqual(a(), 'do you see me? I can see you!', 'return value missing');
        test.done();
    },
    'test checkCircular stack trace parsing' : function(test) {
        test.expect(1);
        var a, b;
        a = checkCircular(function() {
            b();
        });

        b = checkCircular(function() {
            a();
        });

        try{
            a();
        }
        catch(err) {
            var count = err.message.match(/test-circular/g);
            test.strictEqual(count.length, 2, 'the error message should contain this filename 3 times, message is "' + err.message+'"');
        }
        test.done();
    },
    'test error being cleared': function(test) {
        var a, b;
        a = checkCircular(_.once(function() {
            b();
        }));

        b = checkCircular(function() {
            a();
        });

        test.throws(a, 'first call should report circular reference');
        test.doesNotThrow(b, 'second call should not report circular reference');
        test.done();
    }
});

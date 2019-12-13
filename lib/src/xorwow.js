(function (exports) {
    var onePastUInt32Max = Math.pow(2, 32);
    function randomUInt32() {
        return Math.floor(Math.random() * onePastUInt32Max) >>> 0;
    }
    
    function Xorwow(a, b, c, d) {
        if (typeof(a) === "number" && typeof(b) === "number" && typeof(c) === "number" && typeof(d) === "number") {
            // Use supplied seed values
            this.state = {
                a: a,
                b: b,
                c: c,
                d: d
            }
        } else {
            // Seed using Math.random()
            this.state = {
                a: randomUInt32(),
                b: randomUInt32(),
                c: randomUInt32(),
                d: randomUInt32()
            }
        }

        this.state.counter = 0;

        return this;
    }

    Xorwow.prototype.nextUInt32 = function () {
        var t = this.state.d;
        var s = this.state.a;

        this.state.d = this.state.c;
        this.state.c = this.state.b;
        this.state.b = s;

        t ^= t >>> 2;
        t ^= t << 1;
        t ^= s ^ (s << 4);
        this.state.a = t;

        this.state.counter = (this.state.counter + 362437) | 0;

        return (t + this.state.counter) >>> 0;
    };

    Xorwow.prototype.nextDouble = function () {
        return this.nextUInt32() / onePastUInt32Max;
    };

    exports.Xorwow = Xorwow;
})(this);

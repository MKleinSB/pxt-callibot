// Calli:bot 1 & 2 by Knotech
// optimiert von M. Klein 7.2.23

enum C2Motor {
    links,
    rechts,
    beide
}

enum C2Stop {
    //% block="auslaufend"
    Frei,
    //% block="bremsend"
    Bremsen
}

enum C2Servo {
    //% block="Nr.1"
    Servo1,
    //% block="Nr.2"
    Servo2
}

enum C2Sensor {
    links,
    rechts
}

enum C2SensorStatus {
    hell,
    dunkel
}

enum C2Einheit {
    cm,
    mm
}

enum C2RgbLed {
    //% block="links vorne"
    LV,
    //% block="rechts vorne"
    RV,
    //% block="links hinten"
    LH,
    //% block="rechts hinten"
    RH,
    //% block="alle"
    All
}

enum C2RgbColor {
    red = 0xff0000,
    green = 0x00ff00,
    blue = 0x0000ff,
    yellow = 0xffff00,
    violett = 0xa300ff,
    aqua = 0x00ffdc,
    white = 0xffffff,
    black = 0x000000
}

enum C2Dir {
    //% block="vorwärts"
    vorwaerts = 0,
    //% block="rückwärts"
    rueckwaerts = 1
}

enum C2State {
    aus,
    an
}

enum C2SensorWait {
    //% block="Entfernung (cm)"
    distanceCm,
    //% block="Entfernung (mm)"
    distance,
    //% block="Helligkeit"
    brightness,
    //% block="Temperatur"
    temperature,
    //% block="Lautstärke"
    soundLevel,
    //% block="Beschleunigung X"
    accellX,
    //% block="Beschleunigung Y"
    accellY,
    //% block="Beschleunigung Z"
    accellZ
}

enum C2Check {
    //% block="="
    equal,
    //% block="<"
    lessThan,
    //% block=">"
    greaterThan
}



//% weight=50 color="#FF0000" icon="\uf013" block="Calli:bot 2"
namespace calliBot2 {

    let c2Initialized = 0;
    let c2LedState = 0;
    let c2IsBot2 = 0;

    /**
    * Custom color picker
    */
    //% blockId=CallibotNumberPicker block="%value"
    //% blockHidden=true
    //% shim=TD_ID
    //% value.fieldEditor="colornumber" value.fieldOptions.decompileLiterals=true
    //% weight=150
    //% value.fieldOptions.colours='["#ff0000","#00ff00","#0000ff","#ffff00","#a300ff","#00ffdc","#ffffff","#000000"]'
    //% value.fieldOptions.columns=4 value.fieldOptions.className='rgbColorPicker'  
    export function CallibotNumberPicker(value: number) {
        return value;
    }

    function init() {
        if (c2Initialized != 1) {
            c2Initialized = 1;
            let buffer = pins.i2cReadBuffer(0x21, 1);
            if ((buffer[0] & 0x80) != 0) {        // Check if it's a CalliBot2
                c2IsBot2 = 1;
                setRgbLed(C2RgbLed.All, 0, 0, 0);
            }
            else {
                setRgbLed1(C2RgbLed.All, 0, 0)
            }
            setLed(C2Motor.links, false);
            setLed(C2Motor.rechts, false);
            motorStop(C2Motor.beide, C2Stop.Bremsen);
        }
    }

    function writeMotor(nr: C2Motor, direction: C2Dir, speed: number) {
        let buffer = pins.createBuffer(3)
        init()
        buffer[1] = direction;
        buffer[2] = speed;
        switch (nr) {
            case C2Motor.links:
                buffer[0] = 0x00;
                pins.i2cWriteBuffer(0x20, buffer);
                break;
            case C2Motor.beide:
                buffer[0] = 0x00;
                pins.i2cWriteBuffer(0x20, buffer);
            case C2Motor.rechts:
                buffer[0] = 0x02;
                pins.i2cWriteBuffer(0x20, buffer);
                break;
        }
    }


    //% speed.min=5 speed.max=100 speed.defl=50
    //% blockId=C2_motor block="Schalte Motor |%KMotor| |%KDir| mit |%number|\\%"
    export function motor(nr: C2Motor, direction: C2Dir, speed: number) {
        if (speed > 100) {
            speed = 100
        }
        if (speed < 0) {
            speed = 0
        }
        speed = speed * 255 / 100
        writeMotor(nr, direction, speed);
    }

    //="Stoppe Motor $nr"
    //% blockId=C2_motorStop block="Stoppe Motor |%nr| |%mode"
    export function motorStop(nr: C2Motor, mode: C2Stop) {
        if (mode == C2Stop.Frei) {
            writeMotor(nr, 0, 1);
        }
        else {
            writeMotor(nr, 0, 0);
        }
    }

    //% pos.min=0 pos.max=180
    //% pos.shadow="protractorPicker"
    //% blockId=C2_Servo block="Bewege Servo |%nr| auf |%pos|°"
    export function servo(nr: C2Servo, pos: number) {
        let buffer = pins.createBuffer(2)
        if (pos < 0) {
            pos = 0
        }
        if (pos > 180) {
            pos = 180
        }
        switch (nr) {
            case C2Servo.Servo1:
                buffer[0] = 0x14;
                break;
            case C2Servo.Servo2:
                buffer[0] = 0x15;
                break;
        }
        buffer[1] = pos
        pins.i2cWriteBuffer(0x20, buffer)
    }

    //% blockId=C2_SetLed block="Schalte LED |%KSensor| |$anaus"
    //% anaus.shadow="toggleOnOff"
    export function setLed(led: C2Motor, anaus: boolean) {
        let buffer = pins.createBuffer(2)
        init()
        buffer[0] = 0;      // SubAddress of LEDs
        //buffer[1]  Bit 0/1 = state of LEDs
        switch (led) {
            case C2Motor.links:
                if (anaus) {
                    c2LedState |= 0x01
                }
                else {
                    c2LedState &= 0xFE
                }
                break;
            case C2Motor.rechts:
                if (anaus) {
                    c2LedState |= 0x02
                }
                else {
                    c2LedState &= 0xFD
                }
                break;
            case C2Motor.beide:
                if (anaus) {
                    c2LedState |= 0x03
                }
                else {
                    c2LedState &= 0xFC
                }
                break;
        }
        buffer[1] = c2LedState;
        pins.i2cWriteBuffer(0x21, buffer);
    }

    //% intensity.min=0 intensity.max=8 intensity.defl=6
    //% blockId=K_RGB_LED block="V1 Schalte Beleuchtung |%led| Farbe|$color| Helligkeit|$intensity|(0..8)"
    //% color.shadow="CallibotNumberPicker"   
    export function setRgbLed1(led: C2RgbLed, color: number, intensity: number) {
        let len = 0;
        let tColor = 0;
        let index = 0;
        init()
        if (intensity < 0) {
            intensity = 0;
        }
        if (intensity > 8) {
            intensity = 8;
        }
        if (intensity > 0) {
            intensity = (intensity * 2 - 1) * 16;
            switch (color) {
                case C2RgbColor.red:
                    tColor = 0x02
                    break;
                case C2RgbColor.green:
                    tColor = 0x01
                    break;
                case C2RgbColor.blue:
                    tColor = 0x04
                    break;
                case C2RgbColor.yellow:
                    tColor = 0x03
                    break;
                case C2RgbColor.aqua:
                    tColor = 0x05
                    break;
                case C2RgbColor.violett:
                    tColor = 0x06
                    break;
                case C2RgbColor.white:
                    tColor = 0x07
                    break;
                case C2RgbColor.black:
                    tColor = 0x07
                    intensity = 0
                    break;
            }
        }
        switch (led) {
            case C2RgbLed.LH:
                index = 2;
                len = 2;
                break;
            case C2RgbLed.RH:
                index = 3;
                len = 2;
                break;
            case C2RgbLed.LV:
                index = 1;
                len = 2;
                break;
            case C2RgbLed.RV:
                index = 4;
                len = 2;
                break;
            case C2RgbLed.All:
                index = 1;
                len = 5;
                break;
        }
        let buffer = pins.createBuffer(len)
        buffer[0] = index;
        buffer[1] = intensity | tColor
        if (len == 5) {
            buffer[2] = buffer[1];
            buffer[3] = buffer[1];
            buffer[4] = buffer[1];
        }
        pins.i2cWriteBuffer(0x21, buffer);
        basic.pause(10);

    }

    //% intensity.min=0 intensity.max=8
    //% blockId=C2_RGB_LED block="V2 Schalte Beleuchtung $led rot $red grün $green blau $blue"
    //% red.min=0 red.max=16
    //% green.min=0 green.max=16
    //% blue.min=0 blue.max=16
    //% inlineInputMode=inline
    export function setRgbLed(led: C2RgbLed, red: number, green: number, blue: number) {
        let index = 0;
        let buffer = pins.createBuffer(5)
        init()
        if (led != C2RgbLed.All) {
            switch (led) {
                case C2RgbLed.LH:
                    index = 2;
                    break;
                case C2RgbLed.RH:
                    index = 3;
                    break;
                case C2RgbLed.LV:
                    index = 1;
                    break;
                case C2RgbLed.RV:
                    index = 4;
                    break;

            }
            buffer[0] = 0x03;
            buffer[1] = index;
            buffer[2] = red;
            buffer[3] = green;
            buffer[4] = blue;
            pins.i2cWriteBuffer(0x22, buffer);
        }
        else { // all leds, repeat 4 times
            for (index = 1; index < 5; index++) {
                buffer[0] = 0x03;
                buffer[1] = index;
                buffer[2] = red;
                buffer[3] = green;
                buffer[4] = blue;
                pins.i2cWriteBuffer(0x22, buffer);
            }
        }
    }

    //% block="V2 Stoßstange |%sensor| |%status"
    //% color="#00C040" 
    export function readBumperSensor(sensor: C2Sensor, status: C2State): boolean {
        let result = false
        let buffer = pins.i2cReadBuffer(0x21, 1);
        init();
        if (sensor == C2Sensor.links) {
            buffer[0] &= 0x08
        }
        if (sensor == C2Sensor.rechts) {
            buffer[0] &= 0x04
        }

        switch (status) {
            case C2State.an:
                if (buffer[0] != 0) {
                    result = true
                }
                else {
                    result = false
                }
                break
            case C2State.aus:
                if (buffer[0] == 0) {
                    result = true
                }
                else {
                    result = false
                }
                break
        }
        return result;
    }

    //% color="#00C040" block="Liniensensor |%sensor| |%status"
    export function readLineSensor(sensor: C2Sensor, status: C2SensorStatus): boolean {
        let result = false
        let buffer = pins.i2cReadBuffer(0x21, 1);
        init();
        if (sensor == C2Sensor.links) {
            buffer[0] &= 0x02
        }
        if (sensor == C2Sensor.rechts) {
            buffer[0] &= 0x01
        }
        switch (status) {
            case C2SensorStatus.hell:
                if (buffer[0] != 0) {
                    result = true
                }
                else {
                    result = false
                }
                break
            case C2SensorStatus.dunkel:
                if (buffer[0] == 0) {
                    result = true
                }
                else {
                    result = false
                }
                break
        }
        return result
    }

    //% blockId=C2_entfernung color="#00C040" block="Entfernung |%modus" blockGap=8
    export function entfernung(modus: C2Einheit): number {
        let buffer = pins.i2cReadBuffer(0x21, 3)
        init()
        if (modus == C2Einheit.mm) {
            return 256 * buffer[1] + buffer[2]
        }
        else {
            return (256 * buffer[1] + buffer[2]) / 10
        }
    }

    //% blockId=C2_warte color="#0082E6" block="Warte bis |%sensor| |%check| |%value"
    export function warte(sensor: C2SensorWait, check: C2Check, value: number) {
        let abbruch = 0
        let sensorValue = 0
        while (abbruch == 0) {
            switch (sensor) {
                case C2SensorWait.distance:
                    sensorValue = entfernung(C2Einheit.mm)
                    break;
                case C2SensorWait.distanceCm:
                    sensorValue = entfernung(C2Einheit.cm)
                    break;
                case C2SensorWait.accellX:
                    sensorValue = input.acceleration(Dimension.X)
                    break;
                case C2SensorWait.accellY:
                    sensorValue = input.acceleration(Dimension.Y)
                    break;
                case C2SensorWait.accellZ:
                    sensorValue = input.acceleration(Dimension.Z)
                    break;
                case C2SensorWait.brightness:
                    sensorValue = input.lightLevel()
                    break;
                case C2SensorWait.temperature:
                    sensorValue = input.temperature()
                    break;
                case C2SensorWait.soundLevel:
                    sensorValue = input.soundLevel()
                    break;
            }
            switch (check) {
                case C2Check.equal:
                    if (sensorValue == value)
                        abbruch = 1
                    break;
                case C2Check.lessThan:
                    if (sensorValue < value)
                        abbruch = 1
                    break;
                case C2Check.greaterThan:
                    if (sensorValue > value)
                        abbruch = 1
                    break;
            }
        }
    }

    //% color="#0082E6" block="Warte bis Liniensensor $sensor = $status"
    export function warteLSensor(sensor: C2Sensor, status: C2SensorStatus) {
        while (!(readLineSensor(sensor, status))) {
        }
    }

    //% color="#0082E6" block="V2 Warte bis Stoßstange $sensor = $status"
    export function warteBSensor(sensor: C2Sensor, status: C2State) {
        while (!(readBumperSensor(sensor, status))) {
        }
    }
}
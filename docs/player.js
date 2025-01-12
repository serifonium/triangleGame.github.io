var infinJump = false

class Entity {
    constructor(pos, scale) {
        this.body = Matter.Bodies.rectangle(pos.x, pos.y, scale, scale,{
            frictionAir:0,
            restitution:0.15,
            friction:0.7,
            frictionStatic:0,
            render:{
                fillStyle:colorTheme.player
            }
        })
        Matter.Body.set(this.body, "density", 0.001)

        this.collisions = []

        Matter.Composite.add(engine.world, this.body)
    }
}

class Player extends Entity {
    constructor(pos, keyset) {
        var scale = 1
        super(pos, scale*30)
        this.scale = scale

        

        this.keyset = keyset
        this.jumpTime = 0

        this.wallJump = 0


    }

    updateControls() {



        let speed = (Math.PI*2)*0.005,
            jump = 8.5*this.scale

        let entityBodies = new Array()
        for (let i = 0; i < entitys.length; i++) {
            const ent = entitys[i];
            entityBodies.push(ent.body)
        }

        
        let otherBodies = new Array()
        for (let i = 0; i < engine.world.bodies.length; i++) {
            const body = engine.world.bodies[i];
            if (body.id != this.body.id && body.id != fakeGround.id) otherBodies.push(body)
        }

        let detector = ((Matter.Detector.collisions(Matter.Detector.create({
            bodies:[this.body, ...Levels.getGroundBodies(), ...otherBodies]
        })))),
        detector2 = ((Matter.Detector.collisions(Matter.Detector.create({
            bodies:[this.body, fakeGround]
        })))),
        onGround = false

        let altEnt = !(this.body.id != entitys[0].body.id)

        let changeNum = this.collisions.length
        var contactSlopTot = false,
            wallJumpT = 0

        if (detector.length > 0) {
            for (let i = 0; i < detector.length; i++) {
                const coll = detector[i];
                //console.log(coll)
                let includesBody = ((coll.bodyA.id == this.body.id) || (coll.bodyB.id == this.body.id))
                
                var contactSlop = false/*function(){
                    if ((coll.bodyA.slop > 0.05) || (coll.bodyB.slop > 0.05)) {
                        contactSlopTot = Math.sign(coll.bodyB.position.x-coll.bodyA.position.x)*((coll.bodyA.slop > 0.05)?1:-1)
                        return true
                    } else {
                        return false
                    }
                     
                }()*/
                if ((((coll.bodyA.id == this.body.id)?1:-1))*coll.normal.y <= 0 && includesBody) {
                    onGround = true
                    this.jumpTime = (Math.abs(coll.normal.x)>0.5)?20:15

                }

                wallJumpT = (Math.abs(coll.normal.x)>0.5)?Math.sign(coll.normal.x):wallJumpT


                if (
                    ((Math.floor(coll.normal.y) == ((coll.bodyA.id == this.body.id || altEnt)?-1:1)) || 
                    contactSlop
                    ) 
                    && includesBody) {


                }
                if (includesBody) {
                    var collId = `${coll.bodyA.id},${coll.bodyB.id}`
                    if (!this.collisions.includes(collId)) {
                        this.collisions.push(collId)
                    }
                }
                
            }
            
            
            
            

        } else {
            onGround = false
            this.collisions = []
        }
        if (detector.length > 0) this.wallJump = wallJumpT
        if (this.collisions.length > changeNum && sfxButton.on) {
            let aud = new Audio(`assets/sfx/hit${Math.floor(Math.random()*5)+1}.wav`)
            aud.volume = Matter.Common.clamp(getDst(this.body.velocity, v(0,0))/10, 0, 1)
            aud.play()
        }

        if (detector2.length > 0) {
            for (let i = 0; i < detector2.length; i++) {
                const coll = detector2[i];
                if (Math.floor(coll.normal.y+0.15) == ((coll.bodyA.id == this.body.id)?-1:1)) {
                    onGround = true
                    this.jumpTime = 15
                }
            }
            
            

        } 



        function scaleBody(body, x, y) {
            let angle = body.angle

            Matter.Body.setAngle(body, 0)
            Matter.Body.scale(body, x, y)
            Matter.Body.setAngle(body, angle)

        }
        speed *= (contactSlopTot)?0.5:1

        function testKey(keyset, keys) {
            for (let i = 0; i < keyset.length; i++) {
                const key = keyset[i];
                if (keys[key]) {
                    return true
                }
            }
            return false
        }
        

        if (testKey(this.keyset["moveRight"], keys)) {
            if (Math.sign(this.body.angularVelocity) == -1) {
                Matter.Body.setAngularVelocity(this.body, this.body.angularVelocity*0.75)
            }
            if (this.body.angularVelocity < 0.3) this.applyAngularForce(speed*(onGround?1:0.1))
        }
        if (testKey(this.keyset["moveLeft"], keys)) {
            if (Math.sign(this.body.angularVelocity) == 1) {
                Matter.Body.setAngularVelocity(this.body, this.body.angularVelocity*0.75)
            }
            if (this.body.angularVelocity > -0.3) this.applyAngularForce(-speed*(onGround?1:0.1))
        }

        if (testKey(this.keyset["jump"], keys) && (this.jumpTime > 0 || infinJump)) {
            this.applyForce(v((this.wallJump*1), -this.body.velocity.y-(jump*(Math.abs(this.wallJump)?0.75:1))))
            Matter.Body.translate(this.body, v(this.wallJump*5, 0))

            
            //Matter.Body.translate(this.body, v(0,-5))
            this.jumpTime = 0

            if (sfxButton.on) new Audio("assets/sfx/jump.wav").play()
        }
        if (testKey(this.keyset["jump"], keys) && this.jumpTime > -15 && Math.abs(this.body.velocity.y) > 4.5) {
            this.applyForce(v(0,-(jump*0.025)))
        }


        if (testKey(this.keyset["duck"], keys) && !testKey(this.keyset["duck"], preKeys)) {
            scaleBody(this.body, 2/3, 2/3)
        }
        if (!testKey(this.keyset["duck"], keys) && testKey(this.keyset["duck"], preKeys)) {
            scaleBody(this.body, 1.5, 1.5)
        }
        this.jumpTime -= 1*engine.timing.lastDelta/(1000/60)
    }
    applyForce(vel) {
        let timeScale = engine.timing.lastDelta/(1000/60)
        Matter.Body.setVelocity(this.body, v(this.body.velocity.x+(vel.x*timeScale),this.body.velocity.y+(vel.y*timeScale)))
    }
    applyAngularForce(vel) {
        let timeScale = engine.timing.lastDelta/(1000/60)
        Matter.Body.setAngularVelocity(this.body, this.body.angularVelocity+(vel*timeScale))
    }

    update() {
        this.updateControls()
    }
}

var entitys = new Array()



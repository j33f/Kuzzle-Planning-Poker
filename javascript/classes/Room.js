/**
 * A room is a poker planning session and contains some meta datas.
 *
 * Explaination of Room data :
 * - _id : the room ID is the Kuzzle content ID. This is the main identifier to find a room.
 * - name: the name of the room.
 * - users: an array user names which are in the room.
 * - url : the URL shared with all users. For exemple a User Story URL
 * - copy_id : a copy of the _id field, used to subscribe to a specific room update because subscription to _id is impossible with Kuzzle for the moment.
 * - type: constant, used to subscript to all rooms update in the same time, because it's mandadory to provide a filter to Kuzzle.
 */
Poker.planning.Room = function()
{

    /**
     * Contains data which is stored in kuzzle index.
     */
    this.datas = {
        _id: "",
        name: "",
        users: [],
        url: "",
        copy_id: "",
        type: "ROOM"
    }

    this.id = function(id) {
        if(id != undefined) {
            this.datas._id = id;
        }
        return this.datas._id;
    }

    this.copyId = function(id) {
        if(id != undefined) {
            this.datas.copy_id = id;
        }
        return this.datas.copy_id;
    }

    this.name = function(name)
    {
        if(name != undefined) {
            this.datas.name = name;
        }
        return this.datas.name;
    }

    this.url = function(url)
    {
        if(url != undefined) {
            this.datas.url = url;
            this.store();
        }
        return this.datas.url;
    }

    /**
     * Add a new user in the room and send an update request to Kuzzle.
     * @param username
     * @returns {boolean}
     */
    this.addUser = function(username) {
        for(var i = 0; i < this.datas.users.length; i++) {
            if(this.datas.users[i] == username) {
                return false;
            }
        }

        this.datas.users.push(username);
        this.store();
    }

    /**
     * Remove a user from the room. If there is not anymore users, the room is deleted automatically.
     * @param user
     * @param callback
     */
    this.removeUser = function(user, callback) {

        if(user == undefined) {
            user = Poker.planning.nickname();
        }

        var newUsers = [];
        for(var i = 0; i < this.datas.users.length; i++) {
            if(this.datas.users[i] != user) {
                newUsers.push(this.datas.users[i]);
            }
        }
        this.datas.users = newUsers;

        if(this.usersCount() == 0) {
            Poker.planning.RoomManager.removeRoom(this.id(), callback);
        }
        else {
            this.store(callback);
        }

    }

    this.users = function()
    {
        return this.datas.users;
    }

    this.usersCount = function()
    {
        return this.datas.users.length;
    }

    /**
     * Refresh the local datas from Kuzzle datas given in parameters.
     * @param id
     * @param datas
     */
    this.refresh = function(id, datas)
    {
        this.datas = datas;
        this.id(id);
    }

    /**
     * Create or update the room in kuzzle.
     * @param callback
     */
    this.store = function(callback)
    {
        var context = this;
        if(this.id() == "") { // creation

            Poker.planning.kuzzle.create(Poker.planning.RoomManager.KUZZLE_ROOM_COLLECTION, this.datas, true, function(response) {
                if(response.error) {
                    console.error(response.error);
                }
                else {
                    context.id(response.result._id);
                    context.copyId(response.result._id);

                    // saving again for setting copy_id field
                    Poker.planning.kuzzle.update(Poker.planning.RoomManager.KUZZLE_ROOM_COLLECTION, context.datas, function(response) {
                        if(response.error) {
                            console.error(response.error);
                        }

                        Poker.planning.RoomManager.rooms()[context.id()] = context;


                        if(callback != undefined) {
                            callback();
                        }

                    });
                }
            });
        }
        else { // update

            Poker.planning.kuzzle.update(Poker.planning.RoomManager.KUZZLE_ROOM_COLLECTION, this.datas, function(response) {
                if(response.error) {
                    console.error(response.error);
                }

                if(callback != undefined) {
                    callback();
                }

            });
        }
    }

}



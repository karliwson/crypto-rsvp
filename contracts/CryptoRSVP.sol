pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract CryptoRSVP {
    struct User {
        string name;
        string avatarUrl;
        uint256[] events;
    }

    struct EventAttendance {
        address userAddress;
        bool attended;
    }

    enum EventStatus {
        Active,
        Closed,
        Cancelled
    }
    struct Event {
        uint256 id;
        string name;
        uint256 seats;
        address owner;
        uint256 startTime;
        uint256 endTime;
        EventStatus status;
        EventAttendance[] participants;
    }

    event EventEvent(Event _event);

    address private owner;
    mapping(address => User) public users;
    mapping(uint256 => Event) public events;
    uint256 public nEvents;

    constructor() {
        owner = msg.sender;
        nEvents = 0;
    }

    function getContractOwner() public view returns (address) {
        return owner;
    }

    function updateUserProfile(string memory _name, string memory _avatarUrl)
        public
    {
        users[msg.sender].name = _name;
        users[msg.sender].avatarUrl = _avatarUrl;
    }

    function createEvent(
        string memory _name,
        uint256 _seats,
        uint256 _startTime,
        uint256 _endTime
    ) public {
        assertUserExists(msg.sender);

        uint256 _eventId = nEvents++;

        events[_eventId].id = _eventId;
        events[_eventId].name = _name;
        events[_eventId].seats = _seats;
        events[_eventId].owner = msg.sender;
        events[_eventId].startTime = _startTime;
        events[_eventId].endTime = _endTime;
        events[_eventId].status = EventStatus.Active;
        events[_eventId].participants.push(EventAttendance(msg.sender, true));

        users[msg.sender].events.push(_eventId);

        emit EventEvent(events[_eventId]);
    }

    function closeEvent(uint256 _eventId) public {
        assertEventOwner(_eventId, msg.sender);

        events[_eventId].status = EventStatus.Closed;

        // TODO: distribute non-attendants' staked tokens to the attending participants...
    }

    function cancelEvent(uint256 _eventId) public {
        assertEventOwner(_eventId, msg.sender);

        events[_eventId].status = EventStatus.Cancelled;

        // TODO: return staked tokens to participants...
    }

    function checkInEventParticipant(uint256 _eventId, address _userAddress)
        public
    {
        assertEventOwner(_eventId, msg.sender);
        assertParticipantExists(_eventId, _userAddress, true);

        for (uint256 i = 0; i < events[_eventId].participants.length; i++) {
            if (events[_eventId].participants[i].userAddress == _userAddress) {
                // TODO: return participant's staked tokens...

                events[_eventId].participants[i].attended = true;

                break;
            }
        }
    }

    function registerToEvent(uint256 _eventId) public {
        assertParticipantExists(_eventId, msg.sender, false);

        // TODO: stake user's tokens...

        events[_eventId].participants.push(EventAttendance(msg.sender, false));
        users[msg.sender].events.push(_eventId);
    }

    function getEvents() public view returns (uint256[] memory) {
        assertUserExists(msg.sender);

        return users[msg.sender].events;
    }

    function getEventParticipants(uint256 _eventId)
        public
        view
        returns (EventAttendance[] memory)
    {
        assertParticipantExists(_eventId, msg.sender, true);

        return events[_eventId].participants;
    }

    /* Internal */

    function assertUserExists(address _userAddress) internal view {
        require(
            bytes(users[_userAddress].name).length > 0,
            "User does not have a profile"
        );
    }

    function assertEventExists(uint256 _eventId) internal view {
        require(
            bytes(events[_eventId].name).length > 0,
            "Event does not exist"
        );
    }

    function assertEventOwner(uint256 _eventId, address _userAddress)
        internal
        view
    {
        require(
            events[_eventId].owner == _userAddress,
            "User does not own the event"
        );
    }

    function assertParticipantExists(
        uint256 _eventId,
        address _userAddress,
        bool _shouldExist
    ) internal view {
        assertEventExists(_eventId);

        bool _exists = participantExists(_eventId, _userAddress);

        require(
            _exists == _shouldExist,
            _shouldExist
                ? "User is not attending to the event"
                : "User is already attending to the event"
        );
    }

    function participantExists(uint256 _eventId, address _userAddress)
        private
        view
        returns (bool)
    {
        for (uint256 i = 0; i < events[_eventId].participants.length; i++) {
            if (events[_eventId].participants[i].userAddress == _userAddress) {
                return true;
            }
        }
        return false;
    }
}

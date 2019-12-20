
import React from "react";
import styled from "styled-components";

import { exists, roomCapacity } from "./helpers";
import { useModal } from "./modals/modals";
import RoomPropertiesModal from './modals/room_properties_modal';
import EnterLockedRoomModal from "./modals/enter_locked_room_modal";


const Members = ({beds, members}) => {
  const room_size = roomCapacity(beds);
  const people_in_room = members.length
  const free_capacity = room_size - people_in_room
  const tenants = [];
  React.useEffect(() => {
    var elems = document.querySelectorAll('.tooltipped');
    var instances = M.Tooltip.init(elems, {});
  })
  for (let i = 0; i < people_in_room; i++)
  {
    tenants.push(<i className="material-icons" key={i}> person </i>);
  }

  for (let i = 0; i < free_capacity; i++)
  {
    tenants.push(<i className="material-icons" key={i + people_in_room}> person_outline </i>);
  }

  return (
    <span className="right">
      {tenants}
    </span>
  )
}

const MemberList = ({members, users}) => {
  return (
    <span>
      {members.map(member => {
        const first_name = member.user.first_name;
        const last_name = member.user.last_name;
        return first_name + " " + last_name;
      }).join("; ")}
    </span>
  )
}

export const RoomCard = (props) => {
  const {room_ops} = props;

  const isAdmin = props.isAdminView;
  const isMyRoom = () => exists(props.members, ({user}) => props.me.id == user.id);
  const isFull = () => roomCapacity(props.available_beds) <= props.members.length;
  const isLocked = () => props.lock != null && new Date(props.lock.expiration_date) > new Date();

  const canEnter = () => !isAdmin && !isMyRoom() && !isFull();
  const canLeave = () => !isAdmin && isMyRoom();
  const canUnlock = () => !isAdmin && isLocked() && 'password' in props.lock && props.lock.password != null;
  const canLock = () => !isAdmin && !isLocked() && isMyRoom();

  const canDelete = () => isAdmin;
  const canEdit = () => isAdmin;

  const [openModal, closeModal] = useModal()
  const openEditModal = () =>
    openModal(RoomPropertiesModal, {
      data: props,
      closeModal,
      submit: data => room_ops.edit_room(props.id, data)
    })

  const lock = () => {
    room_ops.lock(props.id);
  }

  const enter = () => {
    const response = isLocked()
        ? openModal(EnterLockedRoomModal, {
            data: props,
            closeModal,
            submit: password => room_ops.join(props.id, password)
        })
        : room_ops.join(props.id);

    response.then(
        room => M.toast({
            html: "You've joined room " + room.name,
            displayLength: 2000,
            classes: "success"
        }),
        err => M.toast({
            html: "You cannot join room " + err.body.name,
            displayLength: 2000,
            classes: "error"
        })
    );
  }

  const card_class = () => {
    let cls = "card"
    if (props.hidden) {
      cls += " hidden"
    }
    if (isMyRoom()) {
      cls += " teal lighten-3"
    }
    else if (isFull()) {
      cls += " full"
    }
    else if (isLocked()) {
      cls += " locked"
    }
    return cls;
  }

  return (
    <div className="col s12 xl6">
      <div className={ card_class() }>
        <div className="card-content">
            <span className="card-title grey-text text-darken-4"> {props.name}
            <Members
              beds={props.available_beds}
              members={props.members}
            />
            </span>
            <pre>{isLocked() ? (canUnlock() ? "Password: " + props.lock.password + "\n" : "") + "Locked until: " + props.lock.expiration_date : " "}</pre>
        </div>
        <div className="card-reveal">
          <span className="card-title grey-text text-darken-4">{props.name}<i className="material-icons right">close</i></span>
          <p>
            Members: {props.members.length == 0 ? "-" : <MemberList users={props.users} members={props.members}/> } <br/>
            Beds: {props.available_beds.single} single, {props.available_beds.double} double <br/>
            Description: {props.description}
          </p>
        </div>
        <div className="card-action">
          { canEnter() ? <a href="#" onClick={enter}> enter </a> : '' }
          { canLeave() ? <a href="#" onClick={() => room_ops.leave(props.id)}> leave </a> : '' }
          { canUnlock() ? <a href="#" onClick={() => room_ops.unlock(props.id)}> unlock </a> : '' }
          { canLock() ? <a href="#" onClick={lock}> lock </a> : '' }
          { canDelete() ? <a href="#" onClick={() => room_ops.delete(props.id) }> delete </a> : ''}
          { canEdit() ? <a href="#" onClick={openEditModal}> edit </a> : ""}
          <a></a>{ /* this empty a tag is needed to fix visual problem when room is full */ }
          <a href="javascript:void(0)" className="activator right" style={{"marginRight": 0}}> more </a>
        </div>
      </div>
    </div>
  )
}

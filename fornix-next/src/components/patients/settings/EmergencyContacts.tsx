import React, {useState} from "react";
import EmergencyContact from "../emergency/EmergencyContact";
import NewEmergencyContact from "../emergency/NewEmergencyContact";
import {IEmergencyContact} from "@/utils/types";

const EmergencyContacts = () => {
    // fetch contacts
    const [contacts, setContacts] = useState<IEmergencyContact[]>([
        {
            name: "Asare Docku",
            number: "2422334678",
            relationship: "",
        },
        {
            name: "Rejoice Docku",
            number: "2422334678",
            relationship: "",
        },
    ]);
    return (
        <div>
            <h3 className="text-3xl font-bold mb-[4px]">Emergency contacts</h3>
            <p className="text-gray-500">You can easily manage your emergency contacts by adding and removing them as
                needed.</p>

            <div className="w-3/4 mt-6">
                {contacts?.map((contact, index) => (
                    <EmergencyContact key={index} {...contact} sx="!bg-transparent"
                                      delContact={() => setContacts((prev) => prev.filter((p, i) => i != index))}/>
                ))}
            </div>

            <div className="w-3/4">
                <NewEmergencyContact sx="!bg-transparent" addContact={({
                                                                           name,
                                                                           relationship,
                                                                           number
                                                                       }: IEmergencyContact) => setContacts((prev) => [...prev, {
                    name,
                    relationship,
                    number
                }])}/>
            </div>
        </div>
    );
};

export default EmergencyContacts;

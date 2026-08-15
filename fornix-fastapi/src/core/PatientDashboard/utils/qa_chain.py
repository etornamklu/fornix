import os
from typing import Dict, List
from langchain.chains import LLMChain
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain.memory import ConversationBufferMemory
from langchain.prompts import ChatPromptTemplate
from langchain.prompts import SystemMessagePromptTemplate, MessagesPlaceholder


class QAChain:
    def __init__(self, llm, verbose):
        self.llm = llm
        self.history: List = []
        self.verbose = verbose
        self.prompt = self.prompt_template()

    # def _history_status(self, conversation_id):
    #     self.conversation_id = conversation_id
    #     if not self.history.get(conversation_id):
    #         self.history[conversation_id] = []

    def llm_memory(self):
        memory = ConversationBufferMemory(
            chat_memory=ChatMessageHistory(messages=self.history),
            return_messages=True,
            human_prefix="Human",
            input_key="ask_for",
        )
        return memory

    def qa_chain(self, llm):
        # self._history_status(patient_id, conversation_id)
        memory = self.llm_memory()
        chain = LLMChain(
            llm=llm, memory=memory, prompt=self.prompt, verbose=self.verbose
        )
        return chain

    def prompt_template(self):
        file_path = os.path.join(
            "src", "core", "PatientDashboard", "static", "questions_asking_chain.txt"
        )
        absolute_path = os.path.abspath(file_path)
        prompt = ChatPromptTemplate(
            messages=[
                SystemMessagePromptTemplate.from_template_file(
                    absolute_path,
                    input_variables=[
                        "firstname",
                        "gender",
                        "age",
                        "occupation",
                        "previous_surgeries",
                        "allergies",
                        "past_medical_history",
                        "family_medical_history",
                        "smoking",
                        "alcohol",
                        "recreational_drug_use",
                        "previous_admissions",
                        "diet",
                    ],
                ),
                MessagesPlaceholder(variable_name="history"),
                SystemMessagePromptTemplate.from_template(
                    """Ask the patient for: {ask_for}"""
                ),
            ]
        )
        return prompt

    def __repr__(self) -> str:
        return "<Class 'QAChain'>"

    def __len__(self):
        return len(self.history)
